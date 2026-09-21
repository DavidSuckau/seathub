import type { Revision, RevisionStatus } from "./types";

export const revisionStatusLabel: Record<RevisionStatus, string> = {
  in_entwicklung: "In Entwicklung",
  zur_pruefung: "Zur Prüfung",
  freigegeben: "Freigegeben",
  relaunched: "Relaunch / freigegeben",
  abgelehnt: "Abgelehnt",
  ersetzt: "Ersetzt",
};

export function revisionStatusTone(
  status: RevisionStatus,
): "ok" | "watch" | "warn" | "danger" | "accent" | "neutral" {
  switch (status) {
    case "relaunched":
    case "freigegeben":
      return "ok";
    case "in_entwicklung":
      return "accent";
    case "zur_pruefung":
      return "warn";
    case "abgelehnt":
      return "danger";
    default:
      return "neutral";
  }
}

export function sortRevisions(revs: Revision[]): Revision[] {
  return [...revs].sort((a, b) => a.revision.localeCompare(b.revision, undefined, { numeric: true }));
}

export function nextRevisionNumber(revs: Revision[], fallbackCurrent?: string): string {
  const nums = revs.map((r) => Number(r.revision)).filter((n) => !Number.isNaN(n));
  const fromCurrent = fallbackCurrent ? Number(fallbackCurrent) : 0;
  const max = Math.max(0, fromCurrent, ...nums);
  return String(max + 1).padStart(2, "0");
}

export function getPartRevisions(all: Revision[], partId: string): Revision[] {
  return sortRevisions(all.filter((r) => r.partId === partId));
}

export function getRevision(
  all: Revision[],
  partId: string,
  stand: string,
): Revision | undefined {
  return all.find((r) => r.partId === partId && r.revision === stand);
}
