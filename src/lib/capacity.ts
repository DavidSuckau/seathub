import { CALENDAR_TODAY } from "./calendar";
import type { Task, User } from "./types";

const DONE = new Set(["abgeschlossen", "erledigt", "gestoppt"]);

/** Arbeitswoche für alle – erstmal einheitlich */
export const WEEK_HOURS = 35;

/** Montag der ISO-Woche als YYYY-MM-DD */
export function weekStartKey(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = (date.getDay() + 6) % 7; // Mo=0
  date.setDate(date.getDate() - day);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function formatWeekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const fmt = (dt: Date) =>
    dt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  return `${fmt(start)}–${fmt(end)}`;
}

export function taskPlannedHours(task: Task): number {
  const h = task.plannedHours;
  if (h == null || Number.isNaN(h) || h < 0) return 0;
  return h;
}

export function formatPlannedHours(hours: number): string {
  if (Number.isInteger(hours)) return `${hours} h`;
  return `${hours.toLocaleString("de-DE", { maximumFractionDigits: 1 })} h`;
}

function openAssignedInWeek(
  userId: string,
  tasks: Task[],
  weekStart: string,
): Task[] {
  return tasks.filter(
    (t) =>
      t.assigneeId === userId &&
      !DONE.has(t.status) &&
      weekStartKey(t.dueDate) === weekStart,
  );
}

/** Geplante Stunden einer Person in einer Kalenderwoche (offene Aufträge). */
export function personWeekHours(
  userId: string,
  tasks: Task[],
  weekStart: string = weekStartKey(CALENDAR_TODAY),
): number {
  return openAssignedInWeek(userId, tasks, weekStart).reduce(
    (sum, t) => sum + taskPlannedHours(t),
    0,
  );
}

/** Auslastung in % einer 35-h-Woche */
export function personCapacityFromTasks(
  userId: string,
  tasks: Task[],
  weekStart: string = weekStartKey(CALENDAR_TODAY),
): number {
  const hours = personWeekHours(userId, tasks, weekStart);
  return Math.min(200, Math.round((hours / WEEK_HOURS) * 100));
}

export type PersonWeekLoad = {
  userId: string;
  hours: number;
  percent: number;
  openCount: number;
  /** Summe > 35 h → Überbuchung / Überschneidung in der Woche */
  overloaded: boolean;
  freeHours: number;
  tasks: Task[];
};

export function personWeekLoad(
  userId: string,
  tasks: Task[],
  weekStart: string = weekStartKey(CALENDAR_TODAY),
): PersonWeekLoad {
  const mine = openAssignedInWeek(userId, tasks, weekStart);
  const hours = mine.reduce((s, t) => s + taskPlannedHours(t), 0);
  const percent = Math.min(200, Math.round((hours / WEEK_HOURS) * 100));
  return {
    userId,
    hours,
    percent,
    openCount: mine.length,
    overloaded: hours > WEEK_HOURS,
    freeHours: Math.max(0, WEEK_HOURS - hours),
    tasks: mine,
  };
}

export type DepartmentCapacity = {
  percent: number;
  teamAvg: number;
  queuePressure: number;
  openCount: number;
  unassignedCount: number;
  peopleCount: number;
  weekStart: string;
  weekHours: number;
  byPerson: {
    userId: string;
    percent: number;
    openCount: number;
    hours: number;
    overloaded: boolean;
    freeHours: number;
  }[];
};

/**
 * Auslastung aus geplanten Stunden / 35-h-Woche:
 * - Personen: Summe geplanter Stunden offener Aufträge in der Woche
 * - Abteilung: Ø der Personen + Warteschlange (ohne Assignee) verteilt
 */
export function departmentCapacityFromTasks(
  departmentId: string,
  users: User[],
  tasks: Task[],
  weekStart: string = weekStartKey(CALENDAR_TODAY),
): DepartmentCapacity {
  const people = users.filter(
    (u) => u.departmentId === departmentId && u.demoRole !== "extern",
  );
  const open = tasks.filter(
    (t) => t.departmentId === departmentId && !DONE.has(t.status),
  );
  const openThisWeek = open.filter(
    (t) => weekStartKey(t.dueDate) === weekStart,
  );
  const unassigned = openThisWeek.filter(
    (t) => t.needsAssignment || !t.assigneeId,
  );

  const byPerson = people.map((u) => {
    const load = personWeekLoad(u.id, openThisWeek, weekStart);
    return {
      userId: u.id,
      percent: load.percent,
      openCount: load.openCount,
      hours: load.hours,
      overloaded: load.overloaded,
      freeHours: load.freeHours,
    };
  });

  const teamAvg =
    people.length === 0
      ? 0
      : Math.round(
          byPerson.reduce((s, p) => s + p.percent, 0) / people.length,
        );

  const queueHours = unassigned.reduce((s, t) => s + taskPlannedHours(t), 0);
  const queuePressure =
    people.length === 0
      ? Math.min(200, Math.round((queueHours / WEEK_HOURS) * 100))
      : Math.round((queueHours / people.length / WEEK_HOURS) * 100);

  const percent = Math.min(200, Math.round(teamAvg + queuePressure));

  return {
    percent,
    teamAvg,
    queuePressure,
    openCount: openThisWeek.length,
    unassignedCount: unassigned.length,
    peopleCount: people.length,
    weekStart,
    weekHours: WEEK_HOURS,
    byPerson,
  };
}

export function capacityTone(
  percent: number,
): "ok" | "watch" | "warn" | "danger" {
  if (percent > 110) return "danger";
  if (percent > 95) return "warn";
  if (percent > 80) return "watch";
  return "ok";
}

/** Vorschlagswerte je Auftragstyp (Stunden) */
export const defaultPlannedHoursByType: Partial<Record<string, number>> = {
  naehauftrag: 4,
  schnittentwicklung: 8,
  cad: 6,
  musterbau: 12,
  zuschnittauftrag: 3,
  polsterauftrag: 5,
  dokumentation: 3,
  bezugsentwicklung: 6,
  entwicklungsschleife: 8,
  materialbestellung: 1,
  reparatur: 3,
  support: 2,
  extern: 8,
  pruefung: 2,
  aenderung: 4,
};

export function suggestedPlannedHours(type: string): number {
  return defaultPlannedHoursByType[type] ?? 4;
}
