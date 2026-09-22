"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button, StatusPill } from "@/components/ui";
import { NextAction } from "@/components/NextAction";
import { CALENDAR_TODAY } from "@/lib/calendar";
import { formatDate, taskTypeLabel } from "@/lib/labels";
import { isTeamLead } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { taskPath } from "@/lib/nav";

function greeting(name: string): string {
  const h = new Date().getHours();
  const first = name.split(" ")[0] ?? name;
  if (h < 11) return `Guten Morgen, ${first}`;
  if (h < 18) return `Guten Tag, ${first}`;
  return `Guten Abend, ${first}`;
}

type PersonalHint = {
  id: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
};

export default function DashboardPage() {
  const { state, currentUser } = useStore();
  const uid = state.currentUserId;
  const lead = isTeamLead(currentUser);
  const deptId = currentUser?.departmentId;

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

  /** Nur Hinweise, die diesen Menschen betreffen – keine Firmen-KPIs */
  const personalHints = useMemo(() => {
    const hints: PersonalHint[] = [];

    for (const t of pendingProposals) {
      const p = t.pendingFollowUp!;
      hints.push({
        id: `proposal-${t.id}`,
        title: p.label,
        detail: `Nach „${t.title}“ – bitte bestätigen.`,
        href: taskPath(t.id),
        actionLabel: "Auftrag öffnen",
      });
    }

    const myOpenLops = state.lops.filter(
      (l) =>
        l.status !== "geschlossen" &&
        (l.assigneeIds.includes(uid) ||
          (deptId != null && l.departmentIds.includes(deptId))),
    );
    if (myOpenLops.length > 0 && pendingProposals.length === 0) {
      const mine = myOpenLops.filter((l) => l.assigneeIds.includes(uid));
      const count = mine.length || myOpenLops.length;
      const sample = (mine[0] ?? myOpenLops[0])?.title ?? "offene Punkte";
      hints.push({
        id: "lops-mine",
        title: sample.length > 40 ? `${sample.slice(0, 38)}…` : sample,
        detail:
          mine.length > 0
            ? `${count} offene LOP${count === 1 ? "" : "s"} sind dir zugeordnet.`
            : `${count} offene Punkte betreffen deinen Bereich.`,
        href: "/lops",
        actionLabel: "LOPs ansehen",
      });
    }

    const nextAfterDone = open.find(
      (t) => t.status === "zur_pruefung" || t.checklist?.every((c) => c.done),
    );
    if (nextAfterDone && hints.length < 2) {
      hints.push({
        id: `next-${nextAfterDone.id}`,
        title: nextAfterDone.title,
        detail: "Bereit für den nächsten Schritt – Auftrag öffnen und fortsetzen.",
        href: taskPath(nextAfterDone.id),
        actionLabel: "Auftrag öffnen",
      });
    }

    return hints.slice(0, 3);
  }, [pendingProposals, state.lops, uid, deptId, open]);

  const deptQueue = useMemo(() => {
    if (!lead || !deptId) return [];
    return state.tasks
      .filter(
        (t) =>
          t.departmentId === deptId &&
          (t.needsAssignment || !t.assigneeId) &&
          !["erledigt", "abgeschlossen", "gestoppt"].includes(t.status),
      )
      .slice(0, 5);
  }, [lead, deptId, state.tasks]);

  return (
    <div className="w-full max-w-3xl">
      <header className="mb-8 animate-fade-up">
        <p className="text-sm text-[var(--ink-muted)]">Dein Arbeitstag</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
          {currentUser ? greeting(currentUser.name) : "Mein Tag"}
        </h1>
        <p className="mt-3 text-base text-[var(--ink-muted)]">
          {open.length === 0 ? (
            <>Alles erledigt.</>
          ) : (
            <>
              <span className="font-semibold text-[var(--ink)]">
                {open.length}
              </span>{" "}
              Aufgabe{open.length === 1 ? "" : "n"} offen
              {critical.length > 0 ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-[var(--warn)]">
                    {critical.length} kritisch
                  </span>
                </>
              ) : null}
            </>
          )}
        </p>
        {open.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--ink-subtle)]">
            Du bist für heute fertig.
          </p>
        ) : null}
      </header>

      {top.length > 0 ? (
        <section className="mb-10 space-y-3 animate-fade-up">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
            Als Nächstes
          </h2>
          {(() => {
            const t = top[0];
            const nextStep =
              t.checklist?.find((c) => !c.done)?.label ??
              taskTypeLabel[t.type];
            const dueToday = t.dueDate.slice(0, 10) <= CALENDAR_TODAY;
            return (
              <NextAction
                title="Als Nächstes"
                description={
                  <>
                    <span className="block">{t.title}</span>
                    <span className="mt-1 block text-base font-normal text-[var(--ink-muted)]">
                      {nextStep}
                      {" · "}
                      {dueToday ? "Heute" : formatDate(t.dueDate)}
                    </span>
                  </>
                }
                primaryLabel="Öffnen"
                primaryHref={taskPath(t.id)}
              />
            );
          })()}
          {top.slice(1).map((t) => {
            const nextStep =
              t.checklist?.find((c) => !c.done)?.label ??
              taskTypeLabel[t.type];
            const dueToday = t.dueDate.slice(0, 10) <= CALENDAR_TODAY;
            return (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4"
              >
                <div>
                  <p className="font-semibold text-[var(--ink)]">{t.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                    {nextStep}
                    {" · "}
                    {dueToday ? "Heute" : formatDate(t.dueDate)}
                  </p>
                </div>
                <Link href={taskPath(t.id)}>
                  <Button variant="secondary">Öffnen</Button>
                </Link>
              </div>
            );
          })}
        </section>
      ) : null}

      {personalHints.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
            Für dich relevant
            {personalHints.length > 1
              ? ` · ${personalHints.length} Hinweise`
              : ""}
          </h2>
          <ul className="space-y-3">
            {personalHints.map((h) => (
              <li
                key={h.id}
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
              >
                <p className="text-sm font-medium text-[var(--ink)]">{h.title}</p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">{h.detail}</p>
                <Link
                  href={h.href}
                  className="mt-2 inline-block text-sm font-medium text-[var(--accent)]"
                >
                  {h.actionLabel} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {lead && deptQueue.length > 0 ? (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
              Team – Zuweisung offen
            </h2>
            <Link
              href="/tasks"
              className="text-xs font-medium text-[var(--accent)]"
            >
              Warteschlange
            </Link>
          </div>
          <ul className="space-y-2">
            {deptQueue.map((t) => (
              <li key={t.id}>
                <Link
                  href={taskPath(t.id)}
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
    </div>
  );
}
