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
};

/** Sinnvolle Auftragstypen direkt am Bauteil (Bezug) */
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
};

/** Reihenfolge der Kacheln beim Auftrag anlegen */
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
  "dokumentation",
  "aenderung",
  "materialbestellung",
];

export const orderTypeTileMeta: Record<
  string,
  { shortLabel: string; icon: string; hint: string }
> = {
  cad: { shortLabel: "CAD", icon: "CAD", hint: "Zeichnung" },
  zuschnittauftrag: { shortLabel: "Zuschnitt", icon: "ZS", hint: "Material zuschneiden" },
  naehauftrag: { shortLabel: "Nähen", icon: "NÄ", hint: "Näherei" },
  bezugsentwicklung: { shortLabel: "Bezug", icon: "BE", hint: "Bezugsentwicklung" },
  entwicklungsschleife: { shortLabel: "Schleife", icon: "ES", hint: "Neuer Stand" },
  polsterauftrag: { shortLabel: "Polster", icon: "PO", hint: "Polsterei" },
  pruefung: { shortLabel: "Prüfung", icon: "PR", hint: "Prüfauftrag" },
  schnittentwicklung: { shortLabel: "Schnitt", icon: "SC", hint: "Schnittentwicklung" },
  musterbau: { shortLabel: "Musterbau", icon: "MU", hint: "Physisches Muster" },
  dokumentation: { shortLabel: "Doku", icon: "DO", hint: "Dokumentation" },
  aenderung: { shortLabel: "Änderung", icon: "ÄN", hint: "Änderungsauftrag" },
  materialbestellung: { shortLabel: "Material", icon: "MA", hint: "Bestellung" },
  reparatur: { shortLabel: "Reparatur", icon: "RE", hint: "Reparatur" },
  support: { shortLabel: "Support", icon: "SU", hint: "Support" },
  extern: { shortLabel: "Extern", icon: "EX", hint: "Externer Dienstleister" },
};

export const partKindLabel: Record<string, string> = {
  hauptteil: "Hauptteil / Bezug",
  profil: "Profil",
  befestigung: "Befestigung",
  sonstig: "Komponente",
  schaum: "Schaumteil",
};
