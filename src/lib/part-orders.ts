import { getChildComponents } from "@/lib/components";
import type { Part, Task } from "@/lib/types";

const CLOSED = new Set(["erledigt", "abgeschlossen", "gestoppt", "abgelehnt"]);

export function isOpenOrderStatus(status: string): boolean {
  return !CLOSED.has(status);
}

/** Offene Aufträge, die Freigabe/Abschluss dieses Bauteils blockieren (inkl. Unterbauteile). */
export function openOrdersBlockingPart(
  parts: Part[],
  tasks: Task[],
  partId: string,
): Task[] {
  const childIds = getChildComponents(parts, partId).map((p) => p.id);
  const scope = new Set<string>([partId, ...childIds]);
  return tasks
    .filter((t) => t.partId && scope.has(t.partId) && isOpenOrderStatus(t.status))
    .slice()
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
