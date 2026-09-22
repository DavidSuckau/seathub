"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  type ArtFilter,
  ArtFilterLayout,
  ModuleKindFilter,
  partMatchesArt,
} from "@/components/ModuleKindFilter";
import { AmpelBadge, PageHeader, Panel, StatusPill } from "@/components/ui";
import { CALENDAR_TODAY } from "@/lib/calendar";
import { formatDate, taskStatusLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ModuleKind } from "@/lib/types";

export default function DashboardPage() {
  const { state, currentUser } = useStore();
  const uid = state.currentUserId;
  const [artFilter, setArtFilter] = useState<ArtFilter>("alle");

  const myTasks = state.tasks.filter((t) => t.assigneeId === uid);
  const openAll = myTasks.filter(
    (t) => !["abgeschlossen", "erledigt", "gestoppt"].includes(t.status),
  );

  const availableArts = useMemo(() => {
    const set = new Set<ModuleKind>();
    for (const t of openAll) {
      const part = state.parts.find((p) => p.id === t.partId);
      if (part?.moduleKind) set.add(part.moduleKind);
    }
    return Array.from(set);
  }, [openAll, state.parts]);

  const open = useMemo(() => {
    if (artFilter === "alle") return openAll;
    return openAll.filter((t) => {
      const part = state.parts.find((p) => p.id === t.partId);
      return part ? partMatchesArt(part, artFilter) : false;
    });
  }, [openAll, artFilter, state.parts]);

  const dueToday = open.filter((t) => t.dueDate.slice(0, 10) <= CALENDAR_TODAY);
  const critical = open.filter((t) => t.priority === "kritisch" || t.risk === "rot");
  const myLops = state.lops.filter(
    (l) => l.assigneeIds.includes(uid) && l.status !== "geschlossen",
  );

  /** Nur Freigaben, die meine Aufträge oder meine Projekte betreffen */
  const myApprovals = useMemo(() => {
    return state.approvals.filter((a) => {
      if (a.decision !== "offen") return false;
      if (a.taskId) {
        const task = state.tasks.find((t) => t.id === a.taskId);
        return (
          !!task &&
          (task.assigneeId === uid || task.createdByUserId === uid)
        );
      }
      return state.tasks.some(
        (t) => t.projectId === a.projectId && t.assigneeId === uid,
      );
    });
  }, [state.approvals, state.tasks, uid]);

  const waitingFreigabe = open.filter((t) => t.status === "warten_freigabe");
  const freigabeCount = Math.max(myApprovals.length, waitingFreigabe.length);

  const myProjects = state.projects.filter((p) =>
    state.tasks.some((t) => t.projectId === p.id && t.assigneeId === uid),
  );

  const myDept = currentUser?.departmentId
    ? state.departments.find((d) => d.id === currentUser.departmentId)
    : undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Persönlich"
        title="Mein Tag"
        description={
          currentUser
            ? `${currentUser.name} · ${currentUser.roleLabel}`
            : "Persönliches Dashboard"
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/calendar"
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              → Mein Kalender
            </Link>
            {myDept ? (
              <Link
                href={`/departments/${myDept.id}`}
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                → {myDept.name}
              </Link>
            ) : null}
          </div>
        }
      />

      <ArtFilterLayout
        filter={
          <ModuleKindFilter
            value={artFilter}
            onChange={setArtFilter}
            available={availableArts}
          />
        }
      >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 animate-fade-up">
        {[
          { label: "Offene Aufträge", value: open.length, href: "/tasks" },
          { label: "Heute fällig", value: dueToday.length, href: "/calendar" },
          { label: "Kritisch", value: critical.length, href: "/tasks" },
          { label: "Meine LOPs", value: myLops.length, href: "/lops" },
          {
            label: "Warten auf Freigabe",
            value: freigabeCount,
            href: "/tasks",
          },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow)] transition hover:border-[var(--accent)]"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
              {s.label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Meine Aufträge" className="animate-fade-up">
          <ul className="divide-y divide-[var(--line)]">
            {open.length === 0 ? (
              <li className="py-4 text-sm text-[var(--ink-subtle)]">Keine offenen Aufträge.</li>
            ) : (
              open.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/tasks/${t.id}`}
                    className="flex flex-col gap-1 py-3 transition hover:bg-[var(--bg-elevated)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[var(--ink)]">{t.title}</p>
                      <p className="text-sm text-[var(--ink-muted)]">
                        Fällig {formatDate(t.dueDate)} · {taskStatusLabel[t.status]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.risk ? <AmpelBadge ampel={t.risk} /> : null}
                      <StatusPill
                        tone={
                          t.priority === "kritisch"
                            ? "danger"
                            : t.priority === "hoch"
                              ? "warn"
                              : "neutral"
                        }
                      >
                        {t.priority}
                      </StatusPill>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Panel>

        <div className="space-y-6 animate-fade-up-delay">
          <Panel title="Meine Projekte">
            <ul className="space-y-3">
              {myProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="font-medium">{p.name}</span>
                    <AmpelBadge ampel={p.ampel} />
                  </Link>
                </li>
              ))}
              {myProjects.length === 0 ? (
                <p className="text-sm text-[var(--ink-subtle)]">Keine zugewiesenen Projekte.</p>
              ) : null}
            </ul>
          </Panel>

          <Panel title="Meine Fähigkeiten">
            <ul className="space-y-2">
              {(currentUser?.skills ?? []).map((s) => (
                <li key={s.name} className="flex items-center justify-between text-sm">
                  <span>
                    {s.name}{" "}
                    <span className="text-[var(--ink-subtle)]">
                      · {s.confirmed ? "Bestätigt" : "Selbst angegeben"}
                    </span>
                  </span>
                  <StatusPill tone="accent">Level {s.level}</StatusPill>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Offene LOPs">
            <ul className="space-y-2">
              {myLops.slice(0, 5).map((l) => (
                <li key={l.id}>
                  <Link href={`/lops/${l.id}`} className="text-sm font-medium hover:text-[var(--accent)]">
                    {l.title}
                  </Link>
                </li>
              ))}
              {myLops.length === 0 ? (
                <p className="text-sm text-[var(--ink-subtle)]">Keine offenen LOPs.</p>
              ) : null}
            </ul>
          </Panel>
        </div>
      </div>
      </ArtFilterLayout>
    </div>
  );
}
