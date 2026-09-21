import type {
  ProgramCreateConfig,
  ProgramRowConfig,
  ProgramSeatConfig,
  ProgramTemplate,
  SupplyScope,
} from "./types";

/** Design-Merkmale einer Sitzart – nicht L/R, sondern echte Varianten */
export const DESIGN_TAG_OPTIONS = [
  { id: "mit_airbag", label: "mit Airbag" },
  { id: "ohne_airbag", label: "ohne Airbag" },
  { id: "design_a", label: "Design A" },
  { id: "design_b", label: "Design B" },
  { id: "design_c", label: "Design C" },
  { id: "sport", label: "Sportoptik" },
  { id: "comfort", label: "Comfort" },
] as const;

export const SIDE_MODE_OPTIONS = [
  {
    id: "einzeln" as const,
    label: "Einzeln",
    hint: "Eine Konstruktion / TN – kein L/R-Split",
  },
  {
    id: "mitte" as const,
    label: "Mitte / Bank",
    hint: "Mittig oder Bank, ohne Spiegelpaar",
  },
  {
    id: "lr" as const,
    label: "L/R später",
    hint: "Optional später Links/Rechts anlegen – nicht die Hauptachse",
  },
];

export const designTagLabel = Object.fromEntries(
  DESIGN_TAG_OPTIONS.map((o) => [o.id, o.label]),
) as Record<string, string>;

export function seatDisplayLabel(seat: ProgramSeatConfig): string {
  const base = seat.label.trim() || "Sitz";
  const tags = (seat.designTags ?? [])
    .map((t) => designTagLabel[t] ?? t)
    .filter((t) => !base.toLowerCase().includes(t.toLowerCase()));
  if (!tags.length) return base;
  return `${base} · ${tags.join(" · ")}`;
}

function seat(
  label: string,
  covers: string[],
  designTags: string[] = [],
  sideMode: ProgramSeatConfig["sideMode"] = "einzeln",
): ProgramSeatConfig {
  return { label, covers, designTags, sideMode };
}

/** Fertige Vorlagen im Archiv – für schnelle Projektanlage */
export const BUILTIN_PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: "tpl-r1-airbag-designs",
    name: "1. Reihe · mit/ohne Airbag",
    description:
      "Eine Sitzreihe, zwei Designs: Sportsitz mit Airbag und ohne Airbag – Bezüge getrennt, kein L/R.",
    customerHint: "OEM typisch",
    supplyScope: "bezug_schnittstelle",
    equipment: ["sitzheizung", "airbag"],
    rows: [
      {
        label: "1. Reihe",
        seats: [
          seat("Sportsitz", ["Leder", "Alcantara"], ["mit_airbag", "design_a"], "einzeln"),
          seat("Sportsitz", ["Leder", "Stoff"], ["ohne_airbag", "design_b"], "einzeln"),
        ],
      },
    ],
  },
  {
    id: "tpl-2r-klassisch",
    name: "2 Reihen · Sport + Normal",
    description:
      "1. Reihe Sportsitz/Normalsitz, 2. Reihe Normalsitz – Design-Varianten, Seitenanlage einzeln.",
    supplyScope: "bezug_schnittstelle",
    equipment: ["sitzheizung"],
    rows: [
      {
        label: "1. Reihe",
        seats: [
          seat("Sportsitz", ["Leder", "Alcantara"], ["design_a", "mit_airbag"], "einzeln"),
          seat("Normalsitz", ["Leder", "Stoff"], ["design_b", "ohne_airbag"], "einzeln"),
        ],
      },
      {
        label: "2. Reihe",
        seats: [seat("Normalsitz", ["Leder", "Stoff"], ["ohne_airbag"], "einzeln")],
      },
    ],
  },
  {
    id: "tpl-3r-bank",
    name: "3 Reihen · Fond Bank",
    description: "Drei Reihen, 3. Reihe als Sitzbank (Mitte) – Designs ohne L/R-Zwang.",
    supplyScope: "bezug",
    equipment: ["durchlade"],
    rows: [
      {
        label: "1. Reihe",
        seats: [
          seat("Sportsitz", ["Leder"], ["mit_airbag", "design_a"], "einzeln"),
          seat("Normalsitz", ["Stoff"], ["ohne_airbag"], "einzeln"),
        ],
      },
      {
        label: "2. Reihe",
        seats: [seat("Normalsitz", ["Leder", "Stoff"], ["ohne_airbag"], "einzeln")],
      },
      {
        label: "3. Reihe",
        seats: [seat("Sitzbank", ["Stoff"], ["ohne_airbag"], "mitte")],
      },
    ],
  },
  {
    id: "tpl-komplettsitz",
    name: "Komplettsitz · Design A/B",
    description:
      "Komplettsitz-Umfang: zwei Designs in Reihe 1 (A mit Airbag, B ohne), Module Kunststoff/Schaum/Struktur.",
    supplyScope: "komplettsitz",
    equipment: ["sitzheizung", "sitzlueftung", "airbag", "memory"],
    rows: [
      {
        label: "1. Reihe",
        seats: [
          seat("Sportsitz", ["Alcantara", "Leder"], ["design_a", "mit_airbag"], "einzeln"),
          seat("Sportsitz", ["Leder"], ["design_b", "ohne_airbag"], "einzeln"),
        ],
      },
      {
        label: "2. Reihe",
        seats: [seat("Normalsitz", ["Leder", "Stoff"], ["design_c"], "einzeln")],
      },
    ],
  },
  {
    id: "tpl-leer",
    name: "Leer · selbst aufbauen",
    description: "Minimale Vorlage: eine Reihe, eine Sitzart – alles frei konfigurierbar.",
    supplyScope: "bezug_schnittstelle",
    equipment: [],
    rows: [
      {
        label: "1. Reihe",
        seats: [seat("Normalsitz", ["Leder"], [], "einzeln")],
      },
    ],
  },
];

export function templateToPartialConfig(
  tpl: ProgramTemplate,
): Pick<ProgramCreateConfig, "supplyScope" | "equipment" | "rows" | "description"> {
  return {
    supplyScope: tpl.supplyScope,
    equipment: [...tpl.equipment],
    rows: structuredClone(tpl.rows) as ProgramRowConfig[],
    description: tpl.description,
  };
}

export function countTemplateStats(rows: ProgramRowConfig[]) {
  const seats = rows.reduce((n, r) => n + r.seats.length, 0);
  const covers = rows.reduce(
    (n, r) => n + r.seats.reduce((m, s) => m + s.covers.length, 0),
    0,
  );
  const designs = rows.reduce(
    (n, r) => n + r.seats.filter((s) => (s.designTags?.length ?? 0) > 0).length,
    0,
  );
  return { rows: rows.length, seats, covers, designs };
}

export function supplyScopeOfTemplate(tpl: ProgramTemplate): SupplyScope {
  return tpl.supplyScope;
}
