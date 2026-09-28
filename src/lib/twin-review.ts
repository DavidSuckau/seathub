import type { Task, TaskType, User } from "@/lib/types";

export type TwinReviewGap = {
  id: string;
  label: string;
  detail: string;
};

export type TwinIntakeReview = {
  at: string;
  /** Mitarbeiter, dessen digitaler Zwilling geprüft hat */
  twinUserId: string;
  twinName: string;
  ok: boolean;
  gaps: TwinReviewGap[];
  summary: string;
};

function hasMaterialHint(text: string): boolean {
  return /material|leder|stoff|alcantara|kunstleder|bezug|stoffqualit|artikel/i.test(
    text,
  );
}

function hasMeasurableHint(text: string): boolean {
  return /\d+\s*(mm|cm|m²|qm|stück|stk)|maß|schnitt|naht|stand\s*\d+/i.test(
    text,
  );
}

/** Typen, bei denen Materialangaben typischerweise nötig sind */
const MATERIAL_TYPES = new Set<TaskType>([
  "bezugsentwicklung",
  "schnittentwicklung",
  "naehauftrag",
  "zuschnittauftrag",
  "polsterauftrag",
  "musterbau",
  "materialbestellung",
  "schaumentwicklung",
  "verdrahtung",
]);

/**
 * Demo: digitaler Zwilling des Bearbeiters prüft den Auftrag
 * wie der echte Mitarbeiter – Klarheit, Material, Beschreibung, Termin.
 */
export function reviewOrderAsTwin(
  task: Pick<
    Task,
    | "title"
    | "type"
    | "description"
    | "dueDate"
    | "plannedHours"
    | "priority"
    | "partId"
    | "revisionStand"
  >,
  twin: User,
  now = new Date().toISOString(),
): TwinIntakeReview {
  const gaps: TwinReviewGap[] = [];
  const desc = (task.description ?? "").trim();
  const title = (task.title ?? "").trim();

  if (desc.length < 40) {
    gaps.push({
      id: "beschreibung",
      label: "Beschreibung unklar",
      detail:
        "Zu wenig Kontext – was genau soll verändert/geliefert werden? Bitte Ziel und Abnahme klären.",
    });
  }

  if (!task.partId) {
    gaps.push({
      id: "teilenummer",
      label: "Bauteil fehlt",
      detail: "Ohne Teilenummer weiß ich nicht, an welchem Bezug/Profil ich arbeite.",
    });
  }

  if (!task.revisionStand) {
    gaps.push({
      id: "stand",
      label: "Stand fehlt",
      detail: "Welcher Stand gilt? Ohne Stand-Bezug kann ich nicht starten.",
    });
  }

  if (MATERIAL_TYPES.has(task.type) && !hasMaterialHint(`${title} ${desc}`)) {
    gaps.push({
      id: "material",
      label: "Materialangabe fehlt",
      detail:
        "Material / Qualität / Farbe ist nicht erkennbar – bitte konkretisieren oder Bestellung verknüpfen.",
    });
  }

  if (
    (task.type === "schnittentwicklung" ||
      task.type === "cad" ||
      task.type === "bezugsentwicklung") &&
    !hasMeasurableHint(desc)
  ) {
    gaps.push({
      id: "mass",
      label: "Maße / Vorgaben unklar",
      detail:
        "Keine Maße, Nahtvorgaben oder Änderungsstellen erkennbar – bitte präzisieren.",
    });
  }

  if (!task.dueDate) {
    gaps.push({
      id: "termin",
      label: "Termin fehlt",
      detail: "Ohne Fertigstellungstermin kann ich nicht planen.",
    });
  }

  if (!(task.plannedHours && task.plannedHours > 0)) {
    gaps.push({
      id: "aufwand",
      label: "Kalkulation fehlt",
      detail: "Geplante Stunden fehlen – bitte Aufwand schätzen.",
    });
  }

  if (task.priority === "kritisch" && desc.length < 80) {
    gaps.push({
      id: "kritisch",
      label: "Kritischer Auftrag ohne Klarheit",
      detail:
        "Priorität kritisch, aber die Vorgabe ist dünn – bitte Risiko und Abnahme festziehen.",
    });
  }

  const ok = gaps.length === 0;
  const summary = ok
    ? `Auftrag ist verständlich – ${twin.name.split(" ")[0]} kann starten.`
    : `${gaps.length} Punkt${gaps.length === 1 ? "" : "e"} fehlen noch – bitte nachziehen, bevor die Arbeit beginnt.`;

  return {
    at: now,
    twinUserId: twin.id,
    twinName: twin.name,
    ok,
    gaps,
    summary,
  };
}
