"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { CreateOrderWizard } from "@/components/CreateOrderWizard";
import { formatDate, formatDuration, taskStatusLabel, taskTypeLabel } from "@/lib/labels";
import { defaultTaskScope, isTeamLead, type TaskScope } from "@/lib/roles";
import { useStore } from "@/lib/store";
import type { ModuleKind, TaskStatus } from "@/lib/types";

const statuses = Object.keys(taskStatusLabel) as TaskStatus[];

export default function TasksPage() {
  const { state, currentUser } = useStore();
  const isManager = state.demoRole === "manager";
  const canCreate = isManager || isTeamLead(currentUser);
  const deptId = currentUser?.departmentId;

  const [scope, setScope] = useState<TaskScope>(() =>
    defaultTaskScope(state.demoRole, currentUser),
  );

  useEffect(() => {
    setScope(defaultTaskScope(state.demoRole, currentUser));
  }, [state.demoRole, state.currentUserId, currentUser]);

  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [artFilter, setArtFilter] = useState<ArtFilter>("alle");
  const [showForm, setShowForm] = useState(false);

  const scopedTasks = useMemo(() => {
    if (scope === "alle") return state.tasks;
    if (scope === "abteilung" && deptId) {
      return state.tasks.filter((t) => t.departmentId === deptId);
    }
    return state.tasks.filter((t) => t.assigneeId === state.currentUserId);
  }, [state.tasks, state.currentUserId, scope, deptId]);

  const availableArts = useMemo(() => {
    const set = new Set<ModuleKind>();
    for (const t of scopedTasks) {
      const part = state.parts.find((p) => p.id === t.partId);
      if (part?.moduleKind) set.add(part.moduleKind);
    }
    return Array.from(set);
  }, [scopedTasks, state.parts]);

  const waitingCount = scopedTasks.filter(
    (t) => t.needsAssignment || !t.assigneeId,
  ).length;

  const filtered = useMemo(() => {
    let list = scopedTasks;
    if (artFilter !== "alle") {
      list = list.filter((t) => {
        const part = state.parts.find((p) => p.id === t.partId);
        if (!part) return false;
        return partMatchesArt(part, artFilter);
      });
    }
    if (statusFilter === "zuweisung") {
      return list.filter((t) => t.needsAssignment || !t.assigneeId);
    }
    if (statusFilter === "alle") return list;
    return list.filter((t) => t.status === statusFilter);
  }, [scopedTasks, statusFilter, artFilter, state.parts]);

  const scopeHint =
    scope === "meine"
      ? `Nur dir zugeordnet${currentUser ? ` (${currentUser.name})` : ""}.`
      : scope === "abteilung"
        ? `Alle Aufträge deiner Abteilung${deptId ? ` (${state.departments.find((d) => d.id === deptId)?.name})` : ""}.`
        : "Alle Aufträge im System.";

  return (
    <div>
      <PageHeader
        eyebrow="Operativ"
        title="Aufträge"
        description={
          canCreate
            ? "Typ als Kachel wählen → Abteilung erhält → Mitarbeiter wird zugeordnet."
            : scopeHint
        }
        actions={
          canCreate ? (
            <Button onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Abbrechen" : "Auftrag anlegen"}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: "meine" as const, label: "Meine" },
            ...(deptId
              ? [{ id: "abteilung" as const, label: "Meine Abteilung" }]
              : []),
            ...(isManager ? [{ id: "alle" as const, label: "Alle" }] : []),
          ] as { id: TaskScope; label: string }[]
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setScope(opt.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              scope === opt.id
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {scope === "meine" ? (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
          Du siehst nur Aufträge, die <strong>dir zugeordnet</strong> sind.
        </div>
      ) : scope === "abteilung" ? (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Abteilungsblick – inklusive Zuweisungen offen. Deine persönlichen Aufträge unter{" "}
          <button
            type="button"
            className="font-medium text-[var(--accent)] underline"
            onClick={() => setScope("meine")}
          >
            Meine
          </button>
          .
        </div>
      ) : null}

      {showForm && canCreate ? (
        <CreateOrderWizard onCancel={() => setShowForm(false)} />
      ) : null}

      <div className="mb-3">
        <ModuleKindFilter
          value={artFilter}
          onChange={setArtFilter}
          available={availableArts}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("alle")}
          className={`rounded-md px-3 py-1.5 text-sm ${
            statusFilter === "alle"
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--line)] bg-[var(--surface)]"
          }`}
        >
          Alle Status
        </button>
        {(scope === "abteilung" || scope === "alle") && waitingCount > 0 ? (
          <button
            type="button"
            onClick={() => setStatusFilter("zuweisung")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              statusFilter === "zuweisung"
                ? "bg-[var(--warn)] text-white"
                : "border border-[var(--line)] bg-[var(--surface)]"
            }`}
          >
            Zuweisung offen ({waitingCount})
          </button>
        ) : null}
        {statuses.slice(0, 6).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              statusFilter === s
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] bg-[var(--surface)]"
            }`}
          >
            {taskStatusLabel[s]}
          </button>
        ))}
      </div>

      <Panel>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--ink-subtle)]">
            Keine Aufträge in diesem Filter.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {filtered.map((t) => {
              const project = state.projects.find((p) => p.id === t.projectId);
              const assignee = state.users.find((u) => u.id === t.assigneeId);
              const dept = state.departments.find((d) => d.id === t.departmentId);
              const part = state.parts.find((p) => p.id === t.partId);
              return (
                <li key={t.id}>
                  <Link
                    href={`/tasks/${t.id}`}
                    className="flex flex-col gap-2 py-4 transition hover:bg-[var(--bg-elevated)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[var(--ink)]">{t.title}</p>
                      <p className="text-sm text-[var(--ink-muted)]">
                        {taskTypeLabel[t.type]} · {dept?.name} · {project?.code}
                        {part ? ` · ${part.partNumber}` : ""} ·{" "}
                        {assignee?.name ?? "Zuweisung offen"} · Fällig {formatDate(t.dueDate)}
                        {t.timeSpentMinutes != null && t.timeSpentMinutes > 0
                          ? ` · Dauer ${formatDuration(t.timeSpentMinutes)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.needsAssignment || !t.assigneeId ? (
                        <StatusPill tone="warn">Zuweisung offen</StatusPill>
                      ) : null}
                      {t.risk ? <AmpelBadge ampel={t.risk} /> : null}
                      <StatusPill>{taskStatusLabel[t.status]}</StatusPill>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
