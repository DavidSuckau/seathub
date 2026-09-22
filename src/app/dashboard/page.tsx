"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button, Panel, StatusPill } from "@/components/ui";
import { CALENDAR_TODAY } from "@/lib/calendar";
import { formatDate, taskTypeLabel } from "@/lib/labels";
import { isTeamLead } from "@/lib/roles";
import { useStore } from "@/lib/store";

function greeting(name: string): string {
  const h = new Date().getHours();
  const first = name.split(" ")[0] ?? name;
  if (h < 11) return `Guten Morgen, ${first}`;
  if (h < 18) return `Guten Tag, ${first}`;
  return `Guten Abend, ${first}`;
}

export default function DashboardPage() {
  const { state, currentUser } = useStore();
  const uid = state.currentUserId;
  const lead = isTeamLead(currentUser);

  const open = useMemo(() => {
    return state.tasks
      .filter(
        (t) =>
          t.assigneeId === uid &&
          !["abgeschlossen", "erledigt", "gestoppt"].includes(t.status),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [state.tasks, uid]);

  const critical = open.filter(
    (t) => t.priority === "kritisch" || t.risk === "rot",
  );
  const top = open.slice(0, 5);

  const pendingProposals = state.tasks.filter(
    (t) => t.assigneeId === uid && t.pendingFollowUp,
  );

  const agentHints = (state.agentInsights ?? [])
    .filter((i) => i.severity === "warn" || i.severity === "kritisch")
    .slice(0, 2);

  const deptQueue = useMemo(() => {
    if (!lead || !currentUser?.departmentId) return [];
    return state.tasks
      .filter(
        (t) =>
          t.departmentId === currentUser.departmentId &&
          (t.needsAssignment || !t.assigneeId) &&
          !["erledigt", "abgeschlossen", "gestoppt"].includes(t.status),
      )
      .slice(0, 5);
  }, [lead, currentUser?.departmentId, state.tasks]);

  return (
    <div className="max-w-2xl">
      <header className="mb-8 animate-fade-up">
        <p className="text-sm text-[var(--ink-muted)]">Dein Arbeitstag</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
          {currentUser ? greeting(currentUser.name) : "Mein Tag"}
        </h1>
        <p className="mt-3 text-base text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--ink)]">{open.length}</span>{" "}
          Aufgaben offen
          {critical.length > 0 ? (
            <>
              {" "}
              ·{" "}
              <span className="font-semibold text-[var(--warn)]">
                {critical.length} kritisch
              </span>
            </>
          ) : null}
        </p>
      </header>

      <section className="mb-8 space-y-3 animate-fade-up">
        {top.length === 0 ? (
          <Panel>
            <p className="text-sm text-[var(--ink-muted)]">
              Keine offenen Aufträge. Schöner Tag.
            </p>
          </Panel>
        ) : (
          top.map((t) => {
            const part = state.parts.find((p) => p.id === t.partId);
            const checklistDone =
              t.checklist?.filter((c) => c.done).length ?? 0;
            const checklistTotal = t.checklist?.length ?? 0;
            const nextStep =
              t.checklist?.find((c) => !c.done)?.label ??
              taskTypeLabel[t.type];
            const dueToday = t.dueDate.slice(0, 10) <= CALENDAR_TODAY;
            return (
              <div
                key={t.id}
                className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--ink-subtle)]">
                      {part?.partNumber ?? taskTypeLabel[t.type]}
                    </p>
                    <h2 className="mt-0.5 text-lg font-semibold text-[var(--ink)]">
                      {t.title}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">
                      Nächster Schritt:{" "}
                      <span className="font-medium text-[var(--ink)]">
                        {nextStep}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-subtle)]">
                      {dueToday ? "Heute" : formatDate(t.dueDate)}
                      {checklistTotal > 0
                        ? ` · Fortschritt ${checklistDone}/${checklistTotal}`
                        : t.progress
                          ? ` · ${t.progress} %`
                          : ""}
                    </p>
                  </div>
                  <Link href={`/tasks/${t.id}`}>
                    <Button>Auftrag öffnen</Button>
                  </Link>
                </div>
                {checklistTotal > 0 ? (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{
                        width: `${Math.round((checklistDone / checklistTotal) * 100)}%`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      {pendingProposals.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">
            SeatHub empfiehlt
          </h2>
          <ul className="space-y-3">
            {pendingProposals.map((t) => (
              <li
                key={t.id}
                className="rounded-[var(--radius)] border border-[var(--accent)]/25 bg-[var(--accent-soft)]/50 px-4 py-3"
              >
                <p className="text-sm font-medium text-[var(--ink)]">
                  {t.pendingFollowUp!.label}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Nach „{t.title}“ – bitte bestätigen.
                </p>
                <Link
                  href={`/tasks/${t.id}`}
                  className="mt-2 inline-block text-sm font-medium text-[var(--accent)]"
                >
                  Entscheiden →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : agentHints.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">
            SeatHub empfiehlt
          </h2>
          <ul className="space-y-3">
            {agentHints.map((ins) => (
              <li
                key={ins.id}
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
              >
                <p className="text-sm font-medium text-[var(--ink)]">
                  {ins.title}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{ins.detail}</p>
                {ins.href ? (
                  <Link
                    href={ins.href}
                    className="mt-2 inline-block text-sm font-medium text-[var(--accent)]"
                  >
                    {ins.actionLabel ?? "Öffnen"} →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {lead && deptQueue.length > 0 ? (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              Team – Zuweisung offen
            </h2>
            <Link href="/tasks" className="text-xs font-medium text-[var(--accent)]">
              Warteschlange
            </Link>
          </div>
          <ul className="space-y-2">
            {deptQueue.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tasks/${t.id}`}
                  className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm hover:border-[var(--accent)]"
                >
                  <span className="font-medium">{t.title}</span>
                  <StatusPill tone="warn">Zuweisen</StatusPill>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-center text-xs text-[var(--ink-subtle)]">
        <Link href="/tasks" className="text-[var(--accent)]">
          Alle Aufträge
        </Link>
        {" · "}
        <Link href="/lops" className="text-[var(--accent)]">
          LOPs
        </Link>
      </p>
    </div>
  );
}
