"use client";

import { useRef, useState } from "react";
import { Button, StatusPill } from "@/components/ui";
import type { CutBom, Revision } from "@/lib/types";
import {
  bomLabelsFromCutPieces,
  cutBomFromImport,
  emptyCutBom,
  parseZuschnittCsv,
} from "@/lib/zuschnitt-csv";

export function BezugCutBomPanel({
  revision,
  onChange,
}: {
  revision: Revision;
  onChange: (patch: Partial<Revision>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cutBom = revision.cutBom;

  function createList() {
    setError(null);
    const bom = emptyCutBom();
    onChange({ cutBom: bom, bomItems: revision.bomItems ?? [] });
  }

  async function onFile(files: FileList | null) {
    if (!files?.[0]) return;
    setError(null);
    setBusy(true);
    try {
      const file = files[0];
      const text = await file.text();
      const pieces = parseZuschnittCsv(text);
      const bom = cutBomFromImport(pieces, file.name, cutBom);
      onChange({
        cutBom: bom,
        bomItems: bomLabelsFromCutPieces(pieces),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import fehlgeschlagen.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clearPieces() {
    if (!cutBom) return;
    const next: CutBom = {
      ...cutBom,
      pieces: [],
      importedAt: undefined,
      sourceFileName: undefined,
    };
    onChange({ cutBom: next, bomItems: [] });
  }

  if (!cutBom) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-[var(--line-strong)] bg-[var(--bg)] px-4 py-5">
        <p className="text-sm font-medium">Zuschnitt-Stückliste</p>
        <p className="mt-1 max-w-xl text-sm text-[var(--ink-muted)]">
          Jeder Bezug besteht aus vielen Zuschnittteilen. Die Nummertabelle kommt aus der
          Zuschnittentwicklung – hier direkt am Bauteil, nicht in Excel.
        </p>
        <div className="mt-4">
          <Button onClick={createList}>Stückliste anlegen</Button>
        </div>
      </div>
    );
  }

  const pieces = cutBom.pieces;
  const hasPieces = pieces.length > 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Zuschnitt-Stückliste</p>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {hasPieces
              ? `${pieces.length} Teile${
                  cutBom.sourceFileName ? ` · ${cutBom.sourceFileName}` : ""
                }`
              : "Angelegt – CSV aus der Zuschnittentwicklung importieren"}
          </p>
          {error ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files)}
          />
          <Button
            variant={hasPieces ? "secondary" : "primary"}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Import…" : hasPieces ? "CSV neu importieren" : "CSV importieren"}
          </Button>
          {hasPieces ? (
            <Button variant="ghost" onClick={clearPieces}>
              Leeren
            </Button>
          ) : null}
        </div>
      </div>

      {!hasPieces ? (
        <p className="rounded-[var(--radius)] border border-dashed border-[var(--line)] px-3 py-4 text-sm text-[var(--ink-subtle)]">
          Noch keine Teile. Export aus der Zuschnittentwicklung als CSV wählen
          (Spalten: Teilename, Beschreib, Mat Code, …).
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--line)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--bg)] text-xs uppercase tracking-[0.06em] text-[var(--ink-subtle)]">
              <tr>
                <th className="px-3 py-2 font-medium">Teil</th>
                <th className="px-3 py-2 font-medium">Beschreibung</th>
                <th className="px-3 py-2 font-medium">Kat.</th>
                <th className="px-3 py-2 font-medium">Mat</th>
                <th className="px-3 py-2 font-medium">Fläche</th>
                <th className="px-3 py-2 font-medium">Maße</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {pieces.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--bg-elevated)]">
                  <td className="px-3 py-2 font-mono text-[13px] text-[var(--accent)]">
                    {p.teilename}
                  </td>
                  <td className="px-3 py-2">{p.beschreib || "—"}</td>
                  <td className="px-3 py-2">
                    {p.kategorie ? <StatusPill>{p.kategorie}</StatusPill> : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.matCode || "—"}</td>
                  <td className="px-3 py-2 text-[var(--ink-muted)]">
                    {p.flaecheSqm ? `${p.flaecheSqm} m²` : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--ink-muted)]">
                    {p.teilX && p.teilY ? `${p.teilX} × ${p.teilY}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
