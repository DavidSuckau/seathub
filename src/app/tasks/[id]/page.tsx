"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CompleteTaskForm,
  isDoneStatus,
} from "@/components/CompleteTaskForm";
import { TaskLopPanel } from "@/components/TaskLopPanel";
import { TaskProfilePanel } from "@/components/TaskProfilePanel";
import { Button, Field, Panel, StatusPill, inputClass } from "@/components/ui";
import {
  formatDateTime,
  formatDuration,
  taskStatusLabel,
  taskTypeLabel,
} from "@/lib/labels";
import { orderPreferredSkills, orderTypeDepartment } from "@/lib/orders";
import { orderedFlowPath, suggestAssignees } from "@/lib/platform";
import { useStore } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    state,
    updateTask,
    getProject,
    getPart,
    toggleTaskChecklist,
    completeTaskAutomated,
    acceptFollowUpProposal,
    rejectFollowUpProposal,
  } = useStore();
  const task = state.tasks.find((t) => t.id === params.id);
  const [showComplete, setShowComplete] = useState(false);

  const agentSuggestions = useMemo(
    () => (task ? suggestAssignees(state.users, task.type, 3) : []),
    [task, state.users],
  );

  const flow = useMemo(
    () =>
      task?.flowId
        ? state.flows?.find((f) => f.id === task.flowId)
        : undefined,
    [task?.flowId, state.flows],
  );

  const flowPath = useMemo(
    () => (flow ? orderedFlowPath(flow) : []),
    [flow],
  );

  const candidates = useMemo(() => {
    if (!task) return [];
    const deptId = task.departmentId || orderTypeDepartment[task.type];
    const preferred = orderPreferredSkills[task.type] ?? [];
    return state.users
      .filter((u) => u.departmentId === deptId && u.demoRole !== "extern")
      .map((u) => {
        const skillScore = u.skills
          .filter((s) => preferred.includes(s.name))
          .reduce((acc, s) => acc + s.level, 0);
        return { user: u, skillScore };
      })
      .sort(
        (a, b) =>
          b.skillScore - a.skillScore ||
          a.user.capacityPercent - b.user.capacityPercent,
      );
  }, [task, state.users]);

  if (!task) {
    return (
      <div>
        <p className="text-lg font-semibold">Auftrag nicht gefunden</p>
        <Link href="/tasks" className="text-[var(--accent)]">
          Zurück
        </Link>
      </div>
    );
  }

  const project = getProject(task.projectId);
  const part = task.partId ? getPart(task.partId) : undefined;
  const waiting = task.needsAssignment || !task.assigneeId;
  const done = isDoneStatus(task.status) && (task.timeSpentMinutes ?? 0) > 0;
  const nextChecklist = task.checklist?.find((c) => !c.done)?.label;

  function assignTo(userId: string) {
    updateTask(task!.id, {
      assigneeId: userId,
      needsAssignment: false,
      status: task!.status === "offen" ? "in_bearbeitung" : task!.status,
      startedAt: task!.startedAt ?? new Date().toISOString(),
    });
  }

  function completeWithTime(minutes: number) {
    const result = completeTaskAutomated(task!.id, minutes);
    if (!result.ok) {
      window.alert(result.reason ?? "Abschluss nicht möglich");
      return;
    }
    setShowComplete(false);
    if (result.followUp) {
      const go = window.confirm(
        `Folgeauftrag erzeugt:\n${result.followUp.title}\n\nJetzt öffnen?`,
      );
      if (go) window.location.href = `/tasks/${result.followUp.id}`;
      return;
    }
    if (result.pendingProposal) {
      window.alert(
        `SeatHub empfiehlt: „${result.pendingProposal.label}“ – bitte bestätigen.`,
      );
    }
  }

  function acceptProposal() {
    const created = acceptFollowUpProposal(task!.id);
    if (created) window.location.href = `/tasks/${created.id}`;
  }

  function onStatusChange(next: TaskStatus) {
    if (
      isDoneStatus(next) &&
      !(task!.timeSpentMinutes && task!.timeSpentMinutes > 0)
    ) {
      if (task!.checklist?.length && !task!.checklist.every((c) => c.done)) {
        window.alert("Bitte zuerst die Checkliste vollständig abhaken.");
        return;
      }
      setShowComplete(true);
      return;
    }
    updateTask(task!.id, { status: next });
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-3">
        <Link href="/tasks" className="text-sm font-medium text-[var(--accent)]">
          ← Aufträge
        </Link>
      </p>

      <header className="mb-6">
        <p className="text-sm text-[var(--ink-muted)]">{taskTypeLabel[task.type]}</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
          {task.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill tone={done ? "ok" : waiting ? "warn" : "accent"}>
            {waiting ? "Zuweisung offen" : taskStatusLabel[task.status]}
          </StatusPill>
          {part ? (
            <span className="text-sm text-[var(--ink-muted)]">{part.partNumber}</span>
          ) : null}
          {project ? (
            <Link
              href={`/projects/${project.id}`}
              className="text-sm text-[var(--accent)]"
            >
              {project.code}
            </Link>
          ) : null}
        </div>
      </header>

      {done ? (
        <div className="mb-5 rounded-[var(--radius)] border border-[var(--ok)]/30 bg-[var(--ok-soft)] px-4 py-3 text-sm text-[var(--ok)]">
          <strong>Erledigt</strong> · {formatDuration(task.timeSpentMinutes)}
          {task.completedAt ? ` · ${formatDateTime(task.completedAt)}` : ""}
        </div>
      ) : null}

      {task.pendingFollowUp ? (
        <div className="mb-5 rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent-soft)]/60 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            SeatHub empfiehlt
          </p>
          <p className="mt-1 text-base font-semibold text-[var(--ink)]">
            {task.pendingFollowUp.label}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {taskTypeLabel[task.pendingFollowUp.taskType]}
            {task.pendingFollowUp.note ? ` · ${task.pendingFollowUp.note}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={acceptProposal}>Übernehmen</Button>
            <Button
              variant="secondary"
              onClick={() =>
                rejectFollowUpProposal(task.id, "Abgelehnt in Demo")
              }
            >
              Ablehnen
            </Button>
          </div>
        </div>
      ) : null}

      {!done && !waiting ? (
        <section className="mb-6 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] px-5 py-5 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
            Nächster Schritt
          </p>
          <p className="mt-2 text-xl font-semibold text-[var(--ink)]">
            {nextChecklist ?? taskTypeLabel[task.type]}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {task.status === "offen" ? (
              <Button
                onClick={() =>
                  updateTask(task.id, {
                    status: "in_bearbeitung",
                    startedAt: task.startedAt ?? new Date().toISOString(),
                  })
                }
              >
                Arbeit starten
              </Button>
            ) : (
              <Button onClick={() => setShowComplete(true)}>Erledigen</Button>
            )}
          </div>
        </section>
      ) : null}

      {showComplete ? (
        <CompleteTaskForm
          task={task}
          onConfirm={completeWithTime}
          onCancel={() => setShowComplete(false)}
        />
      ) : null}

      {(task.checklist?.length ?? 0) > 0 ? (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">
            Fortschritt
          </h2>
          <ul className="space-y-2">
            {task.checklist!.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                    checked={c.done}
                    onChange={() => toggleTaskChecklist(task.id, c.id)}
                    disabled={done}
                  />
                  <span
                    className={
                      c.done
                        ? "text-[var(--ink-subtle)] line-through"
                        : "text-[var(--ink)]"
                    }
                  >
                    {c.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {flow && flowPath.length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">Prozess</h2>
          <ol className="space-y-1.5">
            {flowPath
              .filter((n) => n.kind !== "start")
              .map((n) => {
                const current = n.id === task.flowNodeId;
                const currentIdx = flowPath.findIndex(
                  (x) => x.id === task.flowNodeId,
                );
                const nodeIdx = flowPath.findIndex((x) => x.id === n.id);
                const past = currentIdx >= 0 && nodeIdx < currentIdx;
                return (
                  <li
                    key={n.id}
                    className={`flex items-center gap-2 text-sm ${
                      current
                        ? "font-semibold text-[var(--accent)]"
                        : past
                          ? "text-[var(--ok)]"
                          : "text-[var(--ink-muted)]"
                    }`}
                  >
                    <span className="w-4 text-center">
                      {past ? "✓" : current ? "●" : "○"}
                    </span>
                    {n.label}
                  </li>
                );
              })}
          </ol>
        </section>
      ) : null}

      {waiting ? (
        <Panel title="Zuweisen" className="mb-6">
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            SeatHub schlägt vor – du entscheidest.
          </p>
          <ul className="space-y-2">
            {agentSuggestions.map((s, i) => (
              <li
                key={s.user.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">
                    {i + 1}. {s.user.name}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {s.reasons.slice(0, 2).join(" · ")}
                  </p>
                </div>
                <Button onClick={() => assignTo(s.user.id)}>Zuordnen</Button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <details className="mb-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-[var(--ink)]">
          Details & Status
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Status">
            <select
              className={inputClass}
              value={task.status}
              onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
            >
              {Object.entries(taskStatusLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Zugewiesen">
            <select
              className={inputClass}
              value={task.assigneeId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                updateTask(task.id, {
                  assigneeId: id || undefined,
                  needsAssignment: !id,
                });
              }}
            >
              <option value="">— offen —</option>
              {candidates.map(({ user }) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {task.description ? (
          <p className="mt-3 text-sm text-[var(--ink-muted)]">{task.description}</p>
        ) : null}
      </details>

      {(task.history?.length ?? 0) > 0 ? (
        <details className="mb-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-[var(--ink)]">
            Historie
          </summary>
          <ul className="mt-3 space-y-2 text-sm">
            {[...(task.history ?? [])]
              .reverse()
              .slice(0, 12)
              .map((h) => (
                <li key={h.id} className="text-[var(--ink-muted)]">
                  <span className="text-[var(--ink-subtle)]">
                    {formatDateTime(h.at)}
                  </span>{" "}
                  · {h.action}
                  {h.detail ? ` – ${h.detail}` : ""}
                </li>
              ))}
          </ul>
        </details>
      ) : null}

      <details className="mb-6 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-[var(--ink)]">
          Profile & LOPs
        </summary>
        <div className="mt-3 space-y-4">
          <TaskProfilePanel task={task} />
          <TaskLopPanel task={task} />
        </div>
      </details>
    </div>
  );
}
