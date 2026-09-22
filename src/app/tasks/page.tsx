"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AmpelBadge,
  Button,
  FilterChip,
  Modal,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/ui";
import {
  type ArtFilter,
  ArtFilterLayout,
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
            <Button onClick={() => setShowForm(true)}>Auftrag anlegen</Button>
          ) : undefined
        }
      />

      {showForm && canCreate ? (
        <Modal
          title="Neuen Auftrag anlegen"
          size="xl"
          onClose={() => setShowForm(false)}
        >
          <CreateOrderWizard
            embedded
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-1">
        {(
          [
            { id: "meine" as const, label: "Meine" },
            ...(deptId
              ? [{ id: "abteilung" as const, label: "Meine Abteilung" }]
              : []),
            ...(isManager ? [{ id: "alle" as const, label: "Alle" }] : []),
          ] as { id: TaskScope; label: string }[]
        ).map((opt) => (
          <FilterChip
            key={opt.id}
            active={scope === opt.id}
            onClick={() => setScope(opt.id)}
          >
            {opt.label}
          </FilterChip>
        ))}
      </div>

      {scope === "meine" ? (
        <div className="mb-3 rounded-md border border-[var(--accent)]/15 bg-[var(--accent-soft)]/60 px-3 py-2 text-xs text-[var(--accent)]">
          Nur Aufträge, die <strong>dir zugeordnet</strong> sind.
        </div>
      ) : scope === "abteilung" ? (
        <div className="mb-3 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--ink-muted)]">
          Abteilungsblick. Persönliche Aufträge unter{" "}
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

      <ArtFilterLayout
        filter={
          <ModuleKindFilter
            value={artFilter}
            onChange={setArtFilter}
            available={availableArts}
          />
        }
      >
      <div className="mb-4 flex flex-wrap items-center gap-1">
        <FilterChip
          active={statusFilter === "alle"}
          onClick={() => setStatusFilter("alle")}
        >
          Alle Status
        </FilterChip>
        {(scope === "abteilung" || scope === "alle") && waitingCount > 0 ? (
          <FilterChip
            active={statusFilter === "zuweisung"}
            tone="warn"
            onClick={() => setStatusFilter("zuweisung")}
          >
            Zuweisung offen ({waitingCount})
          </FilterChip>
        ) : null}
        {statuses.slice(0, 6).map((s) => (
          <FilterChip
            key={s}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          >
            {taskStatusLabel[s]}
          </FilterChip>
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
      </ArtFilterLayout>
    </div>
  );
}
