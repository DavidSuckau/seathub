"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, PageHeader, Panel, StatusPill } from "@/components/ui";
import {
  CALENDAR_TODAY,
  buildMonthCells,
  groupByDate,
  lopsToCalendarItems,
  monthLabel,
  parseDateKey,
  tasksToCalendarItems,
  type CalendarItem,
} from "@/lib/calendar";
import { isTeamLead } from "@/lib/roles";
import { useStore } from "@/lib/store";

type Scope = "meine" | "abteilung" | "alle";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function CalendarPage() {
  const { state, currentUser } = useStore();
  const today = CALENDAR_TODAY;
  const todayDate = parseDateKey(today);
  const [cursor, setCursor] = useState(() => ({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
  }));
  const [selectedDay, setSelectedDay] = useState(today);
  const [scope, setScope] = useState<Scope>("meine");

  const uid = state.currentUserId;
  const deptId = currentUser?.departmentId;
  const canSeeTeam = state.demoRole === "manager" || isTeamLead(currentUser);

  const items = useMemo(() => {
    let tasks = state.tasks;
    let lops = state.lops;

    if (scope === "meine") {
      tasks = tasks.filter((t) => t.assigneeId === uid);
      lops = lops.filter((l) => l.assigneeIds.includes(uid));
    } else if (scope === "abteilung" && deptId) {
      tasks = tasks.filter((t) => t.departmentId === deptId);
      lops = lops.filter((l) => l.departmentIds.includes(deptId));
    }

    return [
      ...tasksToCalendarItems(tasks, today),
      ...lopsToCalendarItems(lops, today),
    ];
  }, [state.tasks, state.lops, scope, uid, deptId, today]);

  const byDate = useMemo(() => groupByDate(items), [items]);
  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const dayItems: CalendarItem[] = byDate[selectedDay] ?? [];
  const overdueCount = items.filter((i) => i.overdue).length;
  const weekAhead = items.filter((i) => {
    const d = parseDateKey(i.dueDate);
    const end = parseDateKey(today);
    end.setDate(end.getDate() + 7);
    return !i.overdue && d >= parseDateKey(today) && d <= end;
  }).length;

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const scopeLabel =
    scope === "meine"
      ? currentUser
        ? `Kalender von ${currentUser.name}`
        : "Mein Kalender"
      : scope === "abteilung"
        ? "Abteilungs-Kalender"
        : "Gesamter Kalender";

  return (
    <div>
      <PageHeader
        eyebrow="Termine"
        title="Kalender"
        description={`${scopeLabel} – Fälligkeiten von Aufträgen und LOPs.`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setScope("meine")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            scope === "meine"
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
          }`}
        >
          Meine Termine
        </button>
        {deptId ? (
          <button
            type="button"
            onClick={() => setScope("abteilung")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              scope === "abteilung"
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
            }`}
          >
            Meine Abteilung
          </button>
        ) : null}
        {canSeeTeam || state.demoRole === "manager" ? (
          <button
            type="button"
            onClick={() => setScope("alle")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              scope === "alle"
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
            }`}
          >
            Alle
          </button>
        ) : null}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
            Offen gesamt
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl">{items.length}</p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
            Überfällig
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--warn)]">
            {overdueCount}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
            Nächste 7 Tage
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl">{weekAhead}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title={monthLabel(cursor.year, cursor.month)}
          action={
            <div className="flex gap-1">
              <Button variant="ghost" onClick={() => shiftMonth(-1)}>
                ←
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setCursor({
                    year: todayDate.getFullYear(),
                    month: todayDate.getMonth(),
                  });
                  setSelectedDay(today);
                }}
              >
                Heute
              </Button>
              <Button variant="ghost" onClick={() => shiftMonth(1)}>
                →
              </Button>
            </div>
          }
        >
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--ink-subtle)]">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const dayList = byDate[cell.key] ?? [];
              const isToday = cell.key === today;
              const isSelected = cell.key === selectedDay;
              const hasOverdue = dayList.some((i) => i.overdue);
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDay(cell.key)}
                  className={`min-h-[72px] rounded-[var(--radius)] border p-1.5 text-left transition ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : isToday
                        ? "border-[var(--accent)]/40 bg-[var(--surface)]"
                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]/30"
                  } ${!cell.inMonth ? "opacity-40" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday ? "text-[var(--accent)]" : "text-[var(--ink)]"
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayList.length > 0 ? (
                      <span
                        className={`text-[10px] font-medium ${
                          hasOverdue ? "text-[var(--warn)]" : "text-[var(--ink-subtle)]"
                        }`}
                      >
                        {dayList.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayList.slice(0, 2).map((item) => (
                      <div
                        key={`${item.kind}-${item.id}`}
                        className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${
                          item.kind === "lop"
                            ? "bg-[var(--warm-soft)] text-[var(--warm)]"
                            : item.overdue
                              ? "bg-[var(--warn-soft)] text-[var(--warn)]"
                              : "bg-[var(--accent-soft)] text-[var(--accent)]"
                        }`}
                        title={item.title}
                      >
                        {item.kind === "lop" ? "LOP" : "A"} · {item.title}
                      </div>
                    ))}
                    {dayList.length > 2 ? (
                      <p className="text-[10px] text-[var(--ink-subtle)]">
                        +{dayList.length - 2}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[var(--ink-subtle)]">
            Blau = Auftrag · Amber = LOP · Rot = überfällig. Klick auf Tag zeigt die Liste.
          </p>
        </Panel>

        <Panel
          title={
            selectedDay === today
              ? "Heute fällig"
              : `Fällig am ${parseDateKey(selectedDay).toLocaleDateString("de-DE")}`
          }
        >
          {dayItems.length === 0 ? (
            <p className="py-4 text-sm text-[var(--ink-subtle)]">
              An diesem Tag nichts fällig.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {dayItems.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex flex-col gap-1 py-3 transition hover:bg-[var(--bg-elevated)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={item.kind === "lop" ? "warn" : "accent"}>
                        {item.kind === "lop" ? "LOP" : "Auftrag"}
                      </StatusPill>
                      {item.overdue ? (
                        <StatusPill tone="danger">Überfällig</StatusPill>
                      ) : null}
                      {item.priority === "kritisch" || item.priority === "hoch" ? (
                        <StatusPill tone="warn">{item.priority}</StatusPill>
                      ) : null}
                    </div>
                    <p className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--ink-subtle)]">Öffnen →</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
