import type { ModuleKind, Part, PartKind, TaskType } from "@/lib/types";
import { isAssemblyPart, isComponentPart } from "@/lib/components";

export type ModuleChildOption = {
  partKind: PartKind;
  label: string;
  /** Typischer Modul-Kontext des Kindes */
  childModuleKind: ModuleKind;
  /** Beim Anlegen oft CAD beauftragen? */
  defaultCad: boolean;
};

export type ModuleRules = {
  /** Tab-Label für Unterteile (Profile, Schaumteile, …) */
  childrenTabLabel: string;
  /** Kurzer Satz in der UI */
  childrenHint: string;
  /** Welche Unterteile darf man hier anlegen */
  childOptions: ModuleChildOption[];
  /** Auftragstypen, die am Bauteil angeboten werden */
  orderTypes: TaskType[];
  /** Primärer Auftragstyp (Kachel zuerst) */
  primaryOrderType?: TaskType;
};

const SHARED_DOCS: TaskType[] = ["dokumentation", "pruefung", "aenderung", "materialbestellung"];

/** Regeln je Modul – steuern Tabs, Unterteile und Aufträge. */
export const moduleRulesByKind: Record<ModuleKind, ModuleRules> = {
  bezug: {
    childrenTabLabel: "Profile",
    childrenHint:
      "Profile und Befestigungen mit eigener Teilenummer. CAD geht an den Zeichner.",
    childOptions: [
      {
        partKind: "profil",
        label: "Profil",
        childModuleKind: "profil",
        defaultCad: true,
      },
      {
        partKind: "befestigung",
        label: "Befestigung",
        childModuleKind: "profil",
        defaultCad: true,
      },
    ],
    orderTypes: [
      "bezugsentwicklung",
      "entwicklungsschleife",
      "schnittentwicklung",
      "cad",
      "zuschnittauftrag",
      "naehauftrag",
      "polsterauftrag",
      "musterbau",
      ...SHARED_DOCS,
    ],
    primaryOrderType: "bezugsentwicklung",
  },
  profil: {
    childrenTabLabel: "Unterteile",
    childrenHint: "Profile hängen am Bezug – meist keine weiteren Unterteile.",
    childOptions: [],
    orderTypes: ["cad", "aenderung", "pruefung", "dokumentation"],
    primaryOrderType: "cad",
  },
  schaum: {
    childrenTabLabel: "Schaumteile",
    childrenHint: "Schaumteile und Varianten – keine Bezugs-Profile.",
    childOptions: [
      {
        partKind: "schaum",
        label: "Schaumteil",
        childModuleKind: "schaum",
        defaultCad: true,
      },
    ],
    orderTypes: [
      "schaumentwicklung",
      "entwicklungsschleife",
      "cad",
      "musterbau",
      ...SHARED_DOCS,
    ],
    primaryOrderType: "schaumentwicklung",
  },
  kunststoff: {
    childrenTabLabel: "Formteile",
    childrenHint: "Kunststoff-Formteile und Clips – keine Bezugs-Profile.",
    childOptions: [
      {
        partKind: "sonstig",
        label: "Formteil",
        childModuleKind: "kunststoff",
        defaultCad: true,
      },
      {
        partKind: "befestigung",
        label: "Clip / Befestigung",
        childModuleKind: "kunststoff",
        defaultCad: false,
      },
    ],
    orderTypes: [
      "konstruktion",
      "entwicklungsschleife",
      "cad",
      "musterbau",
      ...SHARED_DOCS,
    ],
    primaryOrderType: "konstruktion",
  },
  struktur: {
    childrenTabLabel: "Strukturteile",
    childrenHint: "Träger, Bleche, Schrauben – kein Schaum, keine Profile.",
    childOptions: [
      {
        partKind: "sonstig",
        label: "Strukturteil",
        childModuleKind: "struktur",
        defaultCad: true,
      },
      {
        partKind: "befestigung",
        label: "Schraube / Befestigung",
        childModuleKind: "struktur",
        defaultCad: false,
      },
    ],
    orderTypes: [
      "konstruktion",
      "entwicklungsschleife",
      "cad",
      "musterbau",
      ...SHARED_DOCS,
    ],
    primaryOrderType: "konstruktion",
  },
  metall: {
    childrenTabLabel: "Metallteile",
    childrenHint: "Metallteile und Schrauben – kein Schaum, keine Profile.",
    childOptions: [
      {
        partKind: "sonstig",
        label: "Metallteil",
        childModuleKind: "metall",
        defaultCad: true,
      },
      {
        partKind: "befestigung",
        label: "Schraube / Befestigung",
        childModuleKind: "metall",
        defaultCad: false,
      },
    ],
    orderTypes: [
      "konstruktion",
      "entwicklungsschleife",
      "cad",
      ...SHARED_DOCS,
    ],
    primaryOrderType: "konstruktion",
  },
  schnittstelle: {
    childrenTabLabel: "Anbindungen",
    childrenHint: "Schnittstellen zu Kunststoff oder Struktur dokumentieren.",
    childOptions: [
      {
        partKind: "sonstig",
        label: "Anbindung",
        childModuleKind: "schnittstelle",
        defaultCad: true,
      },
    ],
    orderTypes: [
      "konstruktion",
      "entwicklungsschleife",
      "cad",
      "dokumentation",
      "pruefung",
      "aenderung",
    ],
    primaryOrderType: "konstruktion",
  },
  elektrik: {
    childrenTabLabel: "Elektrik",
    childrenHint:
      "Kabel, Steuergeräte – Verdrahtung und Programmierung beauftragen.",
    childOptions: [
      {
        partKind: "kabel",
        label: "Kabel / Leitungssatz",
        childModuleKind: "elektrik",
        defaultCad: false,
      },
      {
        partKind: "steuergeraet",
        label: "Steuergerät",
        childModuleKind: "elektrik",
        defaultCad: false,
      },
      {
        partKind: "sonstig",
        label: "Sensor / Aktor",
        childModuleKind: "elektrik",
        defaultCad: false,
      },
    ],
    orderTypes: [
      "verdrahtung",
      "programmierung",
      "entwicklungsschleife",
      "pruefung",
      "dokumentation",
      "aenderung",
      "materialbestellung",
    ],
    primaryOrderType: "programmierung",
  },
};

export function resolveModuleKind(part: Part): ModuleKind {
  if (part.moduleKind) return part.moduleKind;
  if (part.partKind === "profil" || part.partKind === "befestigung") return "profil";
  if (part.partKind === "schaum") return "schaum";
  if (part.partKind === "kabel" || part.partKind === "steuergeraet") return "elektrik";
  if (isAssemblyPart(part)) return "bezug";
  return "bezug";
}

export function rulesForPart(part: Part): ModuleRules {
  return moduleRulesByKind[resolveModuleKind(part)];
}

/** Bauteil darf Unterteile führen (Tab anzeigen). */
export function partAllowsChildren(part: Part): boolean {
  if (rulesForPart(part).childOptions.length === 0) return false;
  // Reine Unter-Komponenten selbst nicht weiter verschachteln
  if (
    part.partKind === "profil" ||
    part.partKind === "befestigung" ||
    part.partKind === "kabel"
  ) {
    return false;
  }
  return true;
}

/** Auftragstypen für Wizard – gefiltert nach Bauteil-Modul. */
export function orderTypesForPart(part: Part | undefined): TaskType[] {
  if (!part) {
    return [
      ...moduleRulesByKind.bezug.orderTypes,
      "schaumentwicklung",
      "konstruktion",
      "verdrahtung",
      "programmierung",
      "reparatur",
      "support",
      "extern",
    ];
  }
  if (isComponentPart(part)) {
    const kind = resolveModuleKind(part);
    if (kind === "profil") return moduleRulesByKind.profil.orderTypes;
    if (kind === "elektrik") return moduleRulesByKind.elektrik.orderTypes;
    if (kind === "schaum") return ["schaumentwicklung", "cad", ...SHARED_DOCS];
  }
  return rulesForPart(part).orderTypes;
}
