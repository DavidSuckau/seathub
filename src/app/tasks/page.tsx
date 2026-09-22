"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  PageHeader,
  Panel,
  StatusPill,
  inputClass,
} from "@/components/ui";
import {
  type ArtFilter,
  ArtFilterLayout,
  ModuleKindFilter,
  partMatchesArt,
} from "@/components/ModuleKindFilter";
import { CreateOrderWizard } from "@/components/CreateOrderWizard";
import { formatDate, taskStatusLabel, taskTypeLabel } from "@/lib/labels";
import { defaultTaskScope, isTeamLead, type TaskScope } from "@/lib/roles";
import { useStore } from "@/lib/store";
import type { ModuleKind, TaskStatus } from "@/lib/types";
import { taskPath } from "@/lib/nav";

const statusOptions: { value: string; label: string }[] = [
  { value: "alle", label: "Alle Status" },
  { value: "zuweisung", label: "Zuweisung offen" },
  ...(Object.entries(taskStatusLabel) as [TaskStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

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

  const scopeOptions = (
    [
      { id: "meine" as const, label: "Meine" },
      ...(deptId ? [{ id: "abteilung" as const, label: "Abteilung" }] : []),
      ...(isManager ? [{ id: "alle" as const, label: "Alle" }] : []),
    ] as { id: TaskScope; label: string }[]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Arbeitsplatz"
        title="Aufträge"
        description={
          canCreate
            ? "Deine Warteschlange – und bei Bedarf Aufträge anlegen."
            : "Deine Aufgaben. Eine Aktion: öffnen und erledigen."
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

      <div className="mb-4 flex flex-wrap items-end gap-3">
        {scopeOptions.length > 1 ? (
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-[var(--ink-subtle)]">
              Sicht
            </label>
            <select
              className={inputClass}
              value={scope}
              onChange={(e) => setScope(e.target.value as TaskScope)}
            >
              {scopeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="min-w-[200px] flex-1 sm:max-w-xs">
          <label className="mb-1 block text-xs font-medium text-[var(--ink-subtle)]">
            Status
          </label>
          <select
            className={inputClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value === "zuweisung" && waitingCount > 0
                  ? `${opt.label} (${waitingCount})`
                  : opt.label}
              </option>
            ))}
          </select>
        </div>
        {waitingCount > 0 &&
        (scope === "abteilung" || scope === "alle") &&
        statusFilter !== "zuweisung" ? (
          <button
            type="button"
            onClick={() => setStatusFilter("zuweisung")}
            className="pb-2 text-sm font-medium text-[var(--warn)] hover:underline"
          >
            {waitingCount} ohne Zuweisung
          </button>
        ) : null}
      </div>

      <ArtFilterLayout
        filter={
          <ModuleKindFilter
            value={artFilter}
            onChange={setArtFilter}
            available={availableArts}
          />
        }
      >
        <Panel>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--ink-subtle)]">
              Keine Aufträge in diesem Filter.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {filtered.map((t) => {
                const part = state.parts.find((p) => p.id === t.partId);
                const checklistDone =
                  t.checklist?.filter((c) => c.done).length ?? 0;
                const checklistTotal = t.checklist?.length ?? 0;
                const nextStep =
                  t.checklist?.find((c) => !c.done)?.label ??
                  taskTypeLabel[t.type];
                const pct =
                  checklistTotal > 0
                    ? Math.round((checklistDone / checklistTotal) * 100)
                    : t.progress;
                return (
                  <li key={t.id}>
                    <Link
                      href={taskPath(t.id)}
                      className="flex flex-col gap-3 py-4 transition hover:bg-[var(--bg-elevated)] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-[var(--ink-subtle)]">
                          {part?.partNumber ?? "—"} · {taskTypeLabel[t.type]}
                        </p>
                        <p className="font-semibold text-[var(--ink)]">
                          {t.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--ink-muted)]">
                          Nächster Schritt:{" "}
                          <span className="text-[var(--ink)]">{nextStep}</span>
                        </p>
                        <div className="mt-2 flex max-w-xs items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                            <div
                              className="h-full rounded-full bg-[var(--accent)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-[var(--ink-subtle)]">
                            {pct} %
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--ink-subtle)]">
                          Fällig {formatDate(t.dueDate)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {t.needsAssignment || !t.assigneeId ? (
                          <StatusPill tone="warn">Zuweisung offen</StatusPill>
                        ) : (
                          <StatusPill>{taskStatusLabel[t.status]}</StatusPill>
                        )}
                        <span className="text-sm font-medium text-[var(--accent)]">
                          Öffnen
                        </span>
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
