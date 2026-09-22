import type {
  ArmrestHoleVariant,
  ProgramCreateConfig,
  ProgramRowConfig,
  ProgramSeatConfig,
  ProgramTemplate,
  SupplyScope,
} from "./types";

/** Design-Merkmale einer Sitzart */
export const DESIGN_TAG_OPTIONS = [
  { id: "mit_airbag", label: "mit Airbag" },
  { id: "ohne_airbag", label: "ohne Airbag" },
  { id: "design_a", label: "Design A" },
  { id: "design_b", label: "Design B" },
  { id: "design_c", label: "Design C" },
  { id: "sport", label: "Sportoptik" },
  { id: "comfort", label: "Comfort" },
] as const;

export const ARMREST_HOLE_OPTIONS: {
  id: ArmrestHoleVariant;
  label: string;
  hint: string;
}[] = [
  {
    id: "mit_loch",
    label: "mit Armlehnenloch",
    hint: "Bezug mit Ausschnitt für Armlehne",
  },
  {
    id: "ohne_loch",
    label: "ohne Armlehnenloch",
    hint: "Bezug ohne Armlehnen-Ausschnitt",
  },
];

export const HEADREST_OPTIONS = [
  {
    id: "mit" as const,
    label: "mit Kopfstütze",
    hint: "Kopfstützen-Entwicklung ist Teil des Auftrags",
  },
  {
    id: "ohne" as const,
    label: "ohne Kopfstütze",
    hint: "Keine Kopfstützen-Entwicklung in diesem Umfang",
  },
];

export const SIDE_MODE_OPTIONS = [
  {
    id: "lr" as const,
    label: "Links & Rechts",
    hint: "Eigene L- und R-Bezüge / Spiegelpaar",
  },
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
];

export const designTagLabel = Object.fromEntries(
  DESIGN_TAG_OPTIONS.map((o) => [o.id, o.label]),
) as Record<string, string>;

export const armrestHoleLabel: Record<ArmrestHoleVariant, string> = {
  mit_loch: "mit Armlehnenloch",
  ohne_loch: "ohne Armlehnenloch",
};

export function seatDisplayLabel(seat: ProgramSeatConfig): string {
  const base = seat.label.trim() || "Sitz";
  const tags = (seat.designTags ?? [])
    .map((t) => designTagLabel[t] ?? t)
    .filter((t) => !base.toLowerCase().includes(t.toLowerCase()));
  const extras: string[] = [...tags];
  if (seat.headrest === "mit") extras.push("mit Kopfstütze");
  if (seat.headrest === "ohne") extras.push("ohne Kopfstütze");
  if (!extras.length) return base;
  return `${base} · ${extras.join(" · ")}`;
}

/** Material × Armlehnenloch → Bezugvarianten-Labels */
export function expandCoverLabels(seat: ProgramSeatConfig): string[] {
  const materials =
    seat.covers.map((c) => c.trim()).filter(Boolean).length > 0
      ? seat.covers.map((c) => c.trim()).filter(Boolean)
      : ["Leder"];
  const holes =
    seat.armrestHoles && seat.armrestHoles.length > 0
      ? seat.armrestHoles
      : (["ohne_loch"] as ArmrestHoleVariant[]);
  const labels: string[] = [];
  for (const mat of materials) {
    for (const hole of holes) {
      labels.push(`${mat} · ${armrestHoleLabel[hole]}`);
    }
  }
  return labels;
}

function seat(
  label: string,
  covers: string[],
  designTags: string[] = [],
  sideMode: ProgramSeatConfig["sideMode"] = "lr",
  opts: {
    armrestHoles?: ArmrestHoleVariant[];
    headrest?: ProgramSeatConfig["headrest"];
  } = {},
): ProgramSeatConfig {
  return {
    label,
    covers,
    designTags,
    sideMode,
    armrestHoles: opts.armrestHoles ?? ["mit_loch", "ohne_loch"],
    headrest: opts.headrest ?? "mit",
  };
}

/** Fertige Vorlagen im Archiv – für schnelle Projektanlage */
export const BUILTIN_PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: "tpl-r1-airbag-designs",
    name: "1. Reihe · mit/ohne Airbag · Armlehne",
    description:
      "Eine Sitzreihe: Sportsitz mit/ohne Airbag, Bezüge mit und ohne Armlehnenloch, L/R, mit Kopfstütze.",
    customerHint: "OEM typisch",
    supplyScope: "bezug_schnittstelle",
    equipment: ["sitzheizung", "airbag", "durchlade"],
    includesHeadrest: true,
    sopDateHint: "SOP ca. 18 Monate nach Kick-off",
    rows: [
      {
        label: "1. Reihe",
        seats: [
          seat("Sportsitz", ["Leder", "Alcantara"], ["mit_airbag", "design_a"], "lr", {
            armrestHoles: ["mit_loch", "ohne_loch"],
            headrest: "mit",
          }),
          seat("Sportsitz", ["Leder", "Stoff"], ["ohne_airbag", "design_b"], "lr", {
            armrestHoles: ["ohne_loch"],
            headrest: "mit",
          }),
        ],
      },
    ],
  },
  {
    id: "tpl-2r-klassisch",
    name: "2 Reihen · Sport + Normal",
    description:
      "1. Reihe L/R mit Armlehnenloch-Varianten, 2. Reihe ohne Loch; Kopfstütze in Reihe 1.",
    supplyScope: "bezug_schnittstelle",
    equipment: ["sitzheizung", "durchlade"],
    includesHeadrest: true,
    rows: [
      {
        label: "1. Reihe",
        seats: [
          seat("Sportsitz", ["Leder", "Alcantara"], ["design_a", "mit_airbag"], "lr"),
          seat("Normalsitz", ["Leder", "Stoff"], ["design_b", "ohne_airbag"], "lr"),
        ],
      },
      {
        label: "2. Reihe",
        seats: [
          seat("Normalsitz", ["Leder", "Stoff"], ["ohne_airbag"], "lr", {
            armrestHoles: ["ohne_loch"],
            headrest: "ohne",
          }),
        ],
      },
    ],
  },
  {
    id: "tpl-3r-bank",
    name: "3 Reihen · Fond Bank",
    description: "Drei Reihen, 3. Reihe Bank ohne L/R und ohne Kopfstützen-Entwicklung.",
    supplyScope: "bezug",
    equipment: ["durchlade"],
    includesHeadrest: true,
    rows: [
      {
        label: "1. Reihe",
        seats: [
          seat("Sportsitz", ["Leder"], ["mit_airbag", "design_a"], "lr"),
          seat("Normalsitz", ["Stoff"], ["ohne_airbag"], "lr", {
            armrestHoles: ["ohne_loch"],
          }),
        ],
      },
      {
        label: "2. Reihe",
        seats: [
          seat("Normalsitz", ["Leder", "Stoff"], ["ohne_airbag"], "lr", {
            armrestHoles: ["ohne_loch"],
            headrest: "ohne",
          }),
        ],
      },
      {
        label: "3. Reihe",
        seats: [
          seat("Sitzbank", ["Stoff"], ["ohne_airbag"], "mitte", {
            armrestHoles: ["ohne_loch"],
            headrest: "ohne",
          }),
        ],
      },
    ],
  },
  {
    id: "tpl-komplettsitz",
    name: "Komplettsitz · Design A/B",
    description:
      "Komplettsitz: Design A mit Armlehnenloch + Kopfstütze, Design B ohne Loch.",
    supplyScope: "komplettsitz",
    equipment: ["sitzheizung", "sitzlueftung", "airbag", "memory", "durchlade"],
    includesHeadrest: true,
    rows: [
      {
        label: "1. Reihe",
        seats: [
          seat("Sportsitz", ["Alcantara", "Leder"], ["design_a", "mit_airbag"], "lr"),
          seat("Sportsitz", ["Leder"], ["design_b", "ohne_airbag"], "lr", {
            armrestHoles: ["ohne_loch"],
            headrest: "ohne",
          }),
        ],
      },
      {
        label: "2. Reihe",
        seats: [
          seat("Normalsitz", ["Leder", "Stoff"], ["design_c"], "lr", {
            armrestHoles: ["ohne_loch"],
            headrest: "ohne",
          }),
        ],
      },
    ],
  },
  {
    id: "tpl-ohne-kopfstuetze",
    name: "Nur Bezug · ohne Kopfstütze",
    description:
      "Bezug ohne Kopfstützen-Entwicklung; mit/ohne Armlehnenloch, L/R.",
    supplyScope: "bezug",
    equipment: ["durchlade"],
    includesHeadrest: false,
    rows: [
      {
        label: "1. Reihe",
        seats: [
          seat("Normalsitz", ["Leder", "Stoff"], [], "lr", {
            armrestHoles: ["mit_loch", "ohne_loch"],
            headrest: "ohne",
          }),
        ],
      },
    ],
  },
  {
    id: "tpl-leer",
    name: "Leer · selbst aufbauen",
    description: "Minimale Vorlage: eine Reihe – SOP und Varianten selbst setzen.",
    supplyScope: "bezug_schnittstelle",
    equipment: [],
    includesHeadrest: true,
    rows: [
      {
        label: "1. Reihe",
        seats: [seat("Normalsitz", ["Leder"], [], "lr")],
      },
    ],
  },
];

export function templateToPartialConfig(
  tpl: ProgramTemplate,
): Pick<
  ProgramCreateConfig,
  "supplyScope" | "equipment" | "rows" | "description" | "includesHeadrest"
> {
  return {
    supplyScope: tpl.supplyScope,
    equipment: [...tpl.equipment],
    rows: structuredClone(tpl.rows) as ProgramRowConfig[],
    description: tpl.description,
    includesHeadrest: tpl.includesHeadrest ?? true,
  };
}

export function countTemplateStats(rows: ProgramRowConfig[]) {
  const seats = rows.reduce((n, r) => n + r.seats.length, 0);
  const covers = rows.reduce(
    (n, r) => n + r.seats.reduce((m, s) => m + expandCoverLabels(s).length, 0),
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
