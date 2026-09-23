"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AmpelBadge,
  Button,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/ui";
import {
  type ArtFilter,
  ModuleKindFilter,
  partMatchesArt,
} from "@/components/ModuleKindFilter";
import {
  formatDate,
  locationLabel,
  lopSourceLabel,
  lopStatusLabel,
  formatDuration,
  taskStatusLabel,
  taskTypeLabel,
} from "@/lib/labels";
import {
  departmentCapacityFromTasks,
  formatPlannedHours,
  formatWeekLabel,
  WEEK_HOURS,
  weekStartKey,
} from "@/lib/capacity";
import { useStore } from "@/lib/store";
import type { DepartmentId, ModuleKind, TaskStatus } from "@/lib/types";
import { taskPath } from "@/lib/nav";

const DONE = new Set(["abgeschlossen", "erledigt", "gestoppt"]);

function DeptDashboardInner() {
  const params = useParams<{ id: string }>();
  const { state, getUser } = useStore();
  const deptId = params.id as DepartmentId;
  const dept = state.departments.find((d) => d.id === deptId);
  const [taskFilter, setTaskFilter] = useState<"alle" | "offen" | "zuweisung" | TaskStatus>(
    "offen",
  );
  const [artFilter, setArtFilter] = useState<ArtFilter>("alle");

  const people = useMemo(
    () =>
      state.users.filter((u) => u.departmentId === deptId && u.demoRole !== "extern"),
    [state.users, deptId],
  );

  const capacity = useMemo(
    () => departmentCapacityFromTasks(deptId, state.users, state.tasks),
    [deptId, state.users, state.tasks],
  );

  const allTasksRaw = useMemo(
    () => state.tasks.filter((t) => t.departmentId === deptId),
    [state.tasks, deptId],
  );

  const availableArts = useMemo(() => {
    const set = new Set<ModuleKind>();
    for (const t of allTasksRaw) {
      const part = state.parts.find((p) => p.id === t.partId);
      if (part?.moduleKind) set.add(part.moduleKind);
    }
    return Array.from(set);
  }, [allTasksRaw, state.parts]);

  const allTasks = useMemo(() => {
    if (artFilter === "alle") return allTasksRaw;
    return allTasksRaw.filter((t) => {
      const part = state.parts.find((p) => p.id === t.partId);
      return part ? partMatchesArt(part, artFilter) : false;
    });
  }, [allTasksRaw, artFilter, state.parts]);

  const openTasks = allTasks.filter((t) => !DONE.has(t.status));
  const waiting = openTasks.filter((t) => t.needsAssignment || !t.assigneeId);
  const critical = openTasks.filter((t) => t.priority === "kritisch" || t.risk === "rot");
  const overdue = openTasks.filter((t) => t.dueDate < "2026-09-18");

  const lops = useMemo(
    () =>
      state.lops.filter(
        (l) => l.departmentIds.includes(deptId) && l.status !== "geschlossen",
      ),
    [state.lops, deptId],
  );

  const filteredTasks = useMemo(() => {
    if (taskFilter === "alle") return allTasks;
    if (taskFilter === "offen") return openTasks;
    if (taskFilter === "zuweisung") return waiting;
    return allTasks.filter((t) => t.status === taskFilter);
  }, [allTasks, openTasks, waiting, taskFilter]);

  const byPerson = useMemo(() => {
    return people
      .map((u) => {
        const row = capacity.byPerson.find((p) => p.userId === u.id);
        const weekTasks = openTasks.filter(
          (t) =>
            t.assigneeId === u.id &&
            weekStartKey(t.dueDate) === capacity.weekStart,
        );
        return {
          user: u,
          count: row?.openCount ?? weekTasks.length,
          load: row?.percent ?? 0,
          hours: row?.hours ?? 0,
          overloaded: row?.overloaded ?? false,
          freeHours: row?.freeHours ?? WEEK_HOURS,
          tasks: weekTasks,
        };
      })
      .sort((a, b) => b.hours - a.hours || b.count - a.count);
  }, [people, openTasks, capacity]);

  const timeByType = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const t of allTasks) {
      if (t.timeSpentMinutes == null || t.timeSpentMinutes <= 0) continue;
      const arr = map.get(t.type) ?? [];
      arr.push(t.timeSpentMinutes);
      map.set(t.type, arr);
    }
    return Array.from(map.entries())
      .map(([type, mins]) => ({
        type,
        avg: Math.round(mins.reduce((a, b) => a + b, 0) / mins.length),
        count: mins.length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allTasks]);

  if (!dept) {
    return (
      <div>
        <PageHeader title="Abteilung nicht gefunden" />
        <Link href="/departments" className="text-[var(--accent)] hover:underline">
          Zu allen Abteilungen
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={`${dept.location ? locationLabel[dept.location] : "Standort"} · Abteilungs-Dashboard`}
        title={dept.name}
        description="Gesamtübersicht: alle Aufträge der Abteilung, Zuweisungen, LOPs und Team."
        actions={
          <Link href="/departments">
            <Button variant="secondary">Alle Abteilungen</Button>
          </Link>
        }
      />

      <div className="mb-4">
        <ModuleKindFilter
          value={artFilter}
          onChange={setArtFilter}
          available={availableArts}
        />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Panel>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">Offen</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{openTasks.length}</p>
        </Panel>
        <Panel>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
            Zuweisung offen
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{waiting.length}</p>
        </Panel>
        <Panel>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">Kritisch</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{critical.length}</p>
        </Panel>
        <Panel>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">Überfällig</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{overdue.length}</p>
        </Panel>
        <Panel>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
            Auslastung
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
            {capacity.percent} %
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Woche {formatWeekLabel(capacity.weekStart)} · {WEEK_HOURS} h
            {capacity.unassignedCount > 0
              ? ` · ${capacity.unassignedCount} ohne Zuweisung`
              : ""}
          </p>
        </Panel>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel
            title="Aufträge der Abteilung"
            action={
              <StatusPill tone="accent">
                {filteredTasks.length} angezeigt
              </StatusPill>
            }
          >
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(
                [
                  ["offen", "Offen"],
                  ["zuweisung", "Zuweisung"],
                  ["alle", "Alle"],
                  ["in_bearbeitung", "In Bearbeitung"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTaskFilter(key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    taskFilter === key
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--line)] bg-[var(--bg)] text-[var(--ink-muted)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-[var(--ink-subtle)]">Keine Aufträge in diesem Filter.</p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {filteredTasks.map((t) => {
                  const assignee = t.assigneeId ? getUser(t.assigneeId) : undefined;
                  const project = state.projects.find((p) => p.id === t.projectId);
                  const part = state.parts.find((p) => p.id === t.partId);
                  return (
                    <li key={t.id}>
                      <Link
                        href={taskPath(t.id)}
                        className="flex flex-col gap-1.5 py-3 transition hover:bg-[var(--bg-elevated)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-[var(--ink)]">{t.title}</p>
                          <p className="text-xs text-[var(--ink-muted)]">
                            {taskTypeLabel[t.type]} · {project?.code}
                            {part ? ` · ${part.partNumber}` : ""} ·{" "}
                            {assignee?.name ?? "Zuweisung offen"} · Fällig{" "}
                            {formatDate(t.dueDate)}
                            {t.plannedHours != null
                              ? ` · ${formatPlannedHours(t.plannedHours)} geplant`
                              : ""}
                            {t.timeSpentMinutes != null && t.timeSpentMinutes > 0
                              ? ` · ${formatDuration(t.timeSpentMinutes)}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {t.needsAssignment || !t.assigneeId ? (
                            <StatusPill tone="warn">Zuweisung</StatusPill>
                          ) : null}
                          {t.risk ? <AmpelBadge ampel={t.risk} showLabel={false} /> : null}
                          <StatusPill>{taskStatusLabel[t.status]}</StatusPill>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="LOPs der Abteilung">
            {lops.length === 0 ? (
              <p className="text-sm text-[var(--ink-subtle)]">Keine offenen LOPs.</p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {lops.map((l) => {
                  const project = state.projects.find((p) => p.id === l.projectId);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/lops/${l.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-[var(--bg-elevated)]"
                      >
                        <div>
                          <p className="font-medium">{l.title}</p>
                          <p className="text-xs text-[var(--ink-muted)]">
                            {lopSourceLabel[l.source]} · {project?.code} ·{" "}
                            {l.assigneeIds
                              .map((id) => getUser(id)?.name)
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </p>
                        </div>
                        <StatusPill tone="warn">{lopStatusLabel[l.status]}</StatusPill>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Team & Lastverteilung"
            action={
              <StatusPill tone="neutral">
                {formatWeekLabel(capacity.weekStart)} · {WEEK_HOURS} h
              </StatusPill>
            }
          >
            <ul className="space-y-3">
              {byPerson.map(({ user, count, load, hours, overloaded, freeHours, tasks }) => (
                <li
                  key={user.id}
                  className={`rounded-lg border px-3 py-2.5 ${
                    overloaded
                      ? "border-[var(--warn)]/40 bg-[var(--warn-soft)]"
                      : "border-[var(--line)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-[var(--ink-muted)]">{user.roleLabel}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <StatusPill tone={overloaded ? "warn" : hours > 0 ? "accent" : "neutral"}>
                        {formatPlannedHours(hours)} / {WEEK_HOURS} h
                      </StatusPill>
                      <StatusPill tone={load > 100 ? "warn" : load > 0 ? "accent" : "neutral"}>
                        {load} %
                      </StatusPill>
                      <StatusPill tone={count > 0 ? "accent" : "neutral"}>
                        {count} offen
                      </StatusPill>
                    </div>
                  </div>
                  {overloaded ? (
                    <p className="mt-1.5 text-xs font-medium text-[var(--warn)]">
                      Überschneidung – {formatPlannedHours(hours - WEEK_HOURS)} über{" "}
                      {WEEK_HOURS} h
                    </p>
                  ) : count === 0 ? (
                    <p className="mt-1.5 text-xs text-[var(--ink-subtle)]">
                      Keine Aufträge diese Woche – {formatPlannedHours(freeHours)} frei
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-[var(--ink-subtle)]">
                      Noch {formatPlannedHours(freeHours)} frei
                    </p>
                  )}
                  {tasks.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {tasks.slice(0, 3).map((t) => (
                        <li key={t.id}>
                          <Link
                            href={taskPath(t.id)}
                            className="block truncate text-xs text-[var(--accent)] hover:underline"
                          >
                            {t.title}
                            {t.plannedHours != null
                              ? ` · ${formatPlannedHours(t.plannedHours)}`
                              : ""}
                          </Link>
                        </li>
                      ))}
                      {tasks.length > 3 ? (
                        <li className="text-xs text-[var(--ink-subtle)]">
                          +{tasks.length - 3} weitere
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                </li>
              ))}
              {people.length === 0 ? (
                <p className="text-sm text-[var(--ink-subtle)]">Keine Mitarbeiter hinterlegt.</p>
              ) : null}
            </ul>
          </Panel>

          {timeByType.length > 0 ? (
            <Panel title="Durchschnittszeiten (erledigt)">
              <p className="mb-3 text-xs text-[var(--ink-muted)]">
                Aus dokumentierten Bearbeitungszeiten – hilft bei Planung.
              </p>
              <ul className="space-y-2 text-sm">
                {timeByType.map((row) => (
                  <li
                    key={row.type}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] px-3 py-2"
                  >
                    <span>{taskTypeLabel[row.type] ?? row.type}</span>
                    <span className="font-medium text-[var(--ink)]">
                      Ø {formatDuration(row.avg)}
                      <span className="ml-1 text-xs font-normal text-[var(--ink-subtle)]">
                        ({row.count})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {waiting.length > 0 ? (
            <Panel title="Sofort zuweisen">
              <p className="mb-2 text-xs text-[var(--ink-muted)]">
                Aufträge ohne Mitarbeiter – typische Teamleitungs-Aufgabe.
              </p>
              <ul className="space-y-2">
                {waiting.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={taskPath(t.id)}
                      className="block rounded-lg border border-[var(--warn)]/25 bg-[var(--warn-soft)] px-3 py-2 text-sm text-[var(--warn)] hover:underline"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function DepartmentDashboardPage() {
  return (
    <Suspense fallback={<p className="text-[var(--ink-muted)]">Lädt …</p>}>
      <DeptDashboardInner />
    </Suspense>
  );
}
