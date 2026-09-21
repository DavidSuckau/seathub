import type { Part } from "./types";

export type PartReleaseState = "freigegeben" | "in_entwicklung_nach_freigabe" | "ohne_freigabe";

export function partReleaseState(part: Part): PartReleaseState {
  if (!part.releasedRevision) return "ohne_freigabe";
  if (part.currentRevision !== part.releasedRevision) return "in_entwicklung_nach_freigabe";
  return "freigegeben";
}

/** Anteil Bauteile mit mindestens einer Freigabe (auch wenn weiterentwickelt wird) */
export function projectReleaseProgress(parts: Part[]): {
  total: number;
  released: number;
  percent: number;
  withActiveLoop: number;
  withoutRelease: number;
} {
  const total = parts.length;
  const released = parts.filter((p) => Boolean(p.releasedRevision)).length;
  const withActiveLoop = parts.filter(
    (p) => p.releasedRevision && p.currentRevision !== p.releasedRevision,
  ).length;
  const withoutRelease = total - released;
  const percent = total === 0 ? 0 : Math.round((released / total) * 100);
  return { total, released, percent, withActiveLoop, withoutRelease };
}

export function formatWeightGrams(grams: number | undefined | null): string {
  if (grams == null || Number.isNaN(grams)) return "—";
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg.toLocaleString("de-DE", { maximumFractionDigits: 3 })} kg`;
  }
  return `${Math.round(grams).toLocaleString("de-DE")} g`;
}
