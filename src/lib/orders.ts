import type { DepartmentId, SkillName, TaskType } from "./types";

/** Auftragstyp → Zielabteilung (Delegation) */
export const orderTypeDepartment: Record<TaskType, DepartmentId> = {
  bezugsentwicklung: "engineering",
  entwicklungsschleife: "engineering",
  schnittentwicklung: "schnittentwicklung",
  cad: "cad",
  naehauftrag: "naeherei",
  zuschnittauftrag: "zuschnitt",
  polsterauftrag: "polsterei",
  dokumentation: "dokumentation",
  materialbestellung: "support",
  musterbau: "musterbau",
  reparatur: "naeherei",
  support: "support",
  extern: "extern",
  pruefung: "engineering",
  aenderung: "engineering",
  schaumentwicklung: "engineering",
  konstruktion: "engineering",
  verdrahtung: "elektronik",
  programmierung: "elektronik",
};

/** Sinnvolle Auftragstypen direkt am Bauteil (Bezug) – Legacy; siehe orderTypesForPart */
export const partOrderTypes: TaskType[] = [
  "entwicklungsschleife",
  "bezugsentwicklung",
  "schnittentwicklung",
  "cad",
  "zuschnittauftrag",
  "naehauftrag",
  "polsterauftrag",
  "musterbau",
  "dokumentation",
  "pruefung",
  "aenderung",
];

/** Für Profile / Komponenten: CAD-Zeichnung im Fokus */
export const profileOrderTypes: TaskType[] = [
  "cad",
  "aenderung",
  "pruefung",
  "dokumentation",
];

export const orderTypeHint: Partial<Record<TaskType, string>> = {
  entwicklungsschleife:
    "Neuer Stand am Bauteil – Abteilung Engineering / Bezugsentwicklung übernimmt.",
  schnittentwicklung: "Wird an Schnittentwicklung delegiert und einem Schnittentwickler zugeordnet.",
  cad: "CAD / Zeichnung – eigene Zeichnung je Profil oder Bauteil, geht an die CAD-Abteilung.",
  zuschnittauftrag: "Wird an Zuschnitt delegiert – Teamleitung weist Mitarbeiter zu.",
  naehauftrag: "Wird an Näherei delegiert – Zuweisung an Näher/in (inkl. Profile annähen).",
  polsterauftrag: "Wird an Polsterei delegiert.",
  musterbau: "Musterbau fertigt physisches Muster zum Stand.",
  schaumentwicklung: "Schaumteil entwickeln oder ändern – Engineering Schaum.",
  konstruktion: "Struktur-, Metall- oder Kunststoffkonstruktion.",
  verdrahtung: "Kabelbaum / Verdrahtung – Elektrik-Team.",
  programmierung: "Steuergerät / Software – Programmierer beauftragen.",
};

export const orderPreferredSkills: Partial<Record<TaskType, SkillName[]>> = {
  naehauftrag: ["Naehen", "Leder"],
  zuschnittauftrag: ["Zuschnitt"],
  schnittentwicklung: ["Schnittentwicklung", "CAD"],
  cad: ["CAD"],
  polsterauftrag: ["Polstern"],
  musterbau: ["Musterbau"],
  entwicklungsschleife: ["Musterbau", "Leder"],
  bezugsentwicklung: ["Musterbau", "Leder"],
  reparatur: ["Reparatur", "Naehen"],
  schaumentwicklung: ["Schaum", "CAD"],
  konstruktion: ["Konstruktion", "CAD"],
  verdrahtung: ["Elektronik"],
  programmierung: ["Programmierung", "Elektronik"],
};

/** Reihenfolge der Kacheln beim Auftrag anlegen (Fallback ohne Bauteil) */
export const createOrderTileTypes: TaskType[] = [
  "cad",
  "zuschnittauftrag",
  "naehauftrag",
  "bezugsentwicklung",
  "entwicklungsschleife",
  "polsterauftrag",
  "pruefung",
  "schnittentwicklung",
  "musterbau",
  "schaumentwicklung",
  "konstruktion",
  "verdrahtung",
  "programmierung",
  "dokumentation",
  "aenderung",
  "materialbestellung",
];

export const orderTypeTileMeta: Record<
  string,
  { shortLabel: string; hint: string }
> = {
  cad: { shortLabel: "CAD", hint: "Zeichnung / 3D" },
  zuschnittauftrag: { shortLabel: "Zuschnitt", hint: "Material zuschneiden" },
  naehauftrag: { shortLabel: "Nähen", hint: "Nähmaschine / Näherei" },
  bezugsentwicklung: { shortLabel: "Bezug", hint: "Bezugsentwicklung" },
  entwicklungsschleife: { shortLabel: "Schleife", hint: "Neuer Stand" },
  polsterauftrag: { shortLabel: "Polster", hint: "Polsterei am Sitz" },
  pruefung: { shortLabel: "Prüfung", hint: "Prüfauftrag" },
  schnittentwicklung: { shortLabel: "Schnitt", hint: "Schnittmuster" },
  musterbau: { shortLabel: "Musterbau", hint: "Physisches Muster" },
  dokumentation: { shortLabel: "Doku", hint: "Dokumentation" },
  aenderung: { shortLabel: "Änderung", hint: "Änderungsauftrag" },
  materialbestellung: { shortLabel: "Material", hint: "Bestellung" },
  reparatur: { shortLabel: "Reparatur", hint: "Reparatur" },
  support: { shortLabel: "Support", hint: "Support" },
  extern: { shortLabel: "Extern", hint: "Externer Dienstleister" },
  schaumentwicklung: { shortLabel: "Schaum", hint: "Schaumentwicklung" },
  konstruktion: { shortLabel: "Konstruktion", hint: "Metall / Struktur / KS" },
  verdrahtung: { shortLabel: "Verdrahtung", hint: "Kabel / Elektrik" },
  programmierung: { shortLabel: "Programmierung", hint: "Steuergerät / Software" },
};

export const partKindLabel: Record<string, string> = {
  hauptteil: "Hauptteil / Bezug",
  profil: "Profil",
  befestigung: "Befestigung",
  sonstig: "Komponente",
  schaum: "Schaumteil",
  kabel: "Kabel / Leitungssatz",
  steuergeraet: "Steuergerät",
};
