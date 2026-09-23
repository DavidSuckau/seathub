import type { Lop, Part, Task } from "./types";
import { partPath, taskPath } from "@/lib/nav";

export type CalendarItemKind = "task" | "lop" | "part";

export type CalendarItem = {
  id: string;
  kind: CalendarItemKind;
  title: string;
  dueDate: string; // YYYY-MM-DD
  href: string;
  priority?: string;
  status: string;
  overdue: boolean;
};

/** Demo-„heute“ passend zu Seed-Daten */
export const CALENDAR_TODAY = "2026-09-21";

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

/** Mo–So Zellen für den Monat (inkl. Randtage) */
export function buildMonthCells(year: number, monthIndex: number): {
  key: string;
  inMonth: boolean;
  day: number;
}[] {
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7; // Montag = 0
  const start = new Date(year, monthIndex, 1 - startOffset);
  const cells: { key: string; inMonth: boolean; day: number }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      key: toDateKey(d),
      inMonth: d.getMonth() === monthIndex,
      day: d.getDate(),
    });
  }
  return cells;
}

const DONE_TASK = new Set(["abgeschlossen", "erledigt", "gestoppt", "abgelehnt"]);

export function tasksToCalendarItems(
  tasks: Task[],
  today: string = CALENDAR_TODAY,
): CalendarItem[] {
  return tasks
    .filter((t) => t.dueDate && !DONE_TASK.has(t.status))
    .map((t) => ({
      id: t.id,
      kind: "task" as const,
      title: t.title,
      dueDate: t.dueDate.slice(0, 10),
      href: taskPath(t.id),
      priority: t.priority,
      status: t.status,
      overdue: t.dueDate.slice(0, 10) < today,
    }));
}

export function lopsToCalendarItems(
  lops: Lop[],
  today: string = CALENDAR_TODAY,
): CalendarItem[] {
  return lops
    .filter((l) => l.dueDate && l.status !== "geschlossen")
    .map((l) => ({
      id: l.id,
      kind: "lop" as const,
      title: l.title,
      dueDate: l.dueDate!.slice(0, 10),
      href: `/lops/${l.id}`,
      status: l.status,
      overdue: l.dueDate!.slice(0, 10) < today,
    }));
}

export function partsToCalendarItems(
  parts: Part[],
  today: string = CALENDAR_TODAY,
): CalendarItem[] {
  return parts
    .filter((p) => Boolean(p.dueDate))
    .map((p) => ({
      id: p.id,
      kind: "part" as const,
      title: `${p.partNumber} · ${p.name}`,
      dueDate: p.dueDate!.slice(0, 10),
      href: partPath(p.id),
      status: p.releasedRevision ? "freigegeben" : "offen",
      overdue: p.dueDate!.slice(0, 10) < today,
    }));
}

export function groupByDate(items: CalendarItem[]): Record<string, CalendarItem[]> {
  const map: Record<string, CalendarItem[]> = {};
  for (const item of items) {
    if (!map[item.dueDate]) map[item.dueDate] = [];
    map[item.dueDate].push(item);
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => a.title.localeCompare(b.title));
  }
  return map;
}
