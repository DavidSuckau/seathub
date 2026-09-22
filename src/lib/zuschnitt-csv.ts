import type { CutBom, CutPiece } from "./types";

/** Normalisiert Header aus Zuschnitt-Export (Oft Latin-1/CP1252-Müll). */
function normHeader(h: string): string {
  return h
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/"/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Einfacher CSV-Parser für Anführungszeichen und Kommas. */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function col(
  map: Map<string, number>,
  row: string[],
  ...aliases: string[]
): string {
  for (const a of aliases) {
    const i = map.get(normHeader(a));
    if (i !== undefined && row[i] !== undefined) return row[i].trim();
  }
  return "";
}

function parseArea(raw: string): string {
  return raw.replace(/\s*SQ\s*M/i, "").trim();
}

/**
 * Parst Export der Zuschnittentwicklung (Bezug = viele Zuschnittteile).
 * Erwartet Header wie in testcsv.csv: Teilename, Beschreib, Kategorie, Mat Code, …
 */
export function parseZuschnittCsv(text: string): CutPiece[] {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    throw new Error("CSV leer oder ohne Datenzeilen.");
  }

  const header = rows[0].map(normHeader);
  const map = new Map<string, number>();
  header.forEach((h, i) => {
    if (h && !map.has(h)) map.set(h, i);
  });

  // Robust gegen Encoding-Müll in Flächen-/Byte-Spalten
  if (![...map.keys()].some((k) => k.includes("flche") || k === "flache")) {
    // Spaltenindex 6/7 typisch in Lectra/Gerber-ähnlichen Exporten
    if (!map.has("flache") && rows[0].length > 6) map.set("flache", 6);
    if (!map.has("totalflache") && rows[0].length > 7) map.set("totalflache", 7);
  }

  const pieces: CutPiece[] = [];
  for (const row of rows.slice(1)) {
    const teilename = col(map, row, "teilename", "teil", "name");
    if (!teilename) continue;
    const beschreib = col(map, row, "beschreib", "beschreibung", "description");
    pieces.push({
      id: `cut-${teilename}-${pieces.length}`,
      teilename,
      beschreib,
      kategorie: col(map, row, "kategorie", "category") || undefined,
      kommentar: col(map, row, "kommentar", "comment") || undefined,
      matCode: col(map, row, "matcode", "mat code", "material") || undefined,
      flaecheSqm: parseArea(
        col(map, row, "flache", "flaeche", "flδche", "area"),
      ) || undefined,
      totalFlaecheSqm: parseArea(
        col(map, row, "totalflache", "totalflaeche", "total flache"),
      ) || undefined,
      umrissMm: col(map, row, "umriss", "perimeter") || undefined,
      teilX: col(map, row, "teilx", "teil x") || undefined,
      teilY: col(map, row, "teily", "teil y") || undefined,
      anzKnips: col(map, row, "anzknips", "anz knips") || undefined,
      anzEcke: col(map, row, "anzecke", "anz ecke") || undefined,
    });
  }

  if (pieces.length === 0) {
    throw new Error("Keine Zuschnittteile in der CSV gefunden.");
  }
  return pieces;
}

export function emptyCutBom(nowIso = new Date().toISOString()): CutBom {
  return {
    createdAt: nowIso,
    pieces: [],
  };
}

export function cutBomFromImport(
  pieces: CutPiece[],
  fileName: string,
  previous?: CutBom | null,
): CutBom {
  const now = new Date().toISOString();
  return {
    createdAt: previous?.createdAt ?? now,
    importedAt: now,
    sourceFileName: fileName,
    pieces,
  };
}

/** Kurzliste für Legacy-bomItems am Stand */
export function bomLabelsFromCutPieces(pieces: CutPiece[]): string[] {
  return pieces.map((p) =>
    p.beschreib ? `${p.teilename} – ${p.beschreib}` : p.teilename,
  );
}
