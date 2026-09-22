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
import {
  AmpelBadge,
  Button,
  Field,
  PageHeader,
  Panel,
  StatusPill,
  inputClass,
} from "@/components/ui";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  taskStatusLabel,
  taskTypeLabel,
} from "@/lib/labels";
import { orderPreferredSkills, orderTypeDepartment } from "@/lib/orders";
import { suggestAssignees } from "@/lib/platform";
import { useStore } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, updateTask, startDevelopmentLoop, getProject, getUser, getPart, toggleTaskChecklist, completeTaskAutomated } =
    useStore();
  const task = state.tasks.find((t) => t.id === params.id);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [pickId, setPickId] = useState("");

  const agentSuggestions = useMemo(
    () => (task ? suggestAssignees(state.users, task.type, 3) : []),
    [task, state.users],
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
        <PageHeader title="Auftrag nicht gefunden" />
        <Link href="/tasks" className="text-[var(--accent)]">
          Zurück zur Liste
        </Link>
      </div>
    );
  }

  const project = getProject(task.projectId);
  const assignee = task.assigneeId ? getUser(task.assigneeId) : undefined;
  const part = task.partId ? getPart(task.partId) : undefined;
  const creator = task.createdByUserId ? getUser(task.createdByUserId) : undefined;
  const dept = state.departments.find((d) => d.id === task.departmentId);
  const waiting = task.needsAssignment || !task.assigneeId;
  const done = isDoneStatus(task.status) && (task.timeSpentMinutes ?? 0) > 0;

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
      if (go) {
        window.location.href = `/tasks/${result.followUp.id}`;
      }
    }
  }

  function onStatusChange(next: TaskStatus) {
    if (isDoneStatus(next) && !(task!.timeSpentMinutes && task!.timeSpentMinutes > 0)) {
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
    <div>
      <PageHeader
        eyebrow={taskTypeLabel[task.type]}
        title={task.title}
        description={task.description}
        actions={
          <Link href="/tasks">
            <Button variant="secondary">Alle Aufträge</Button>
          </Link>
        }
      />

      {waiting ? (
        <div className="mb-5 rounded-[var(--radius)] border border-[var(--warn)]/30 bg-[var(--warn-soft)] px-4 py-3 text-sm text-[var(--warn)]">
          <strong>Zuweisung offen</strong> – Auftrag liegt bei{" "}
          <strong>{dept?.name ?? task.departmentId}</strong>. Bitte einen Mitarbeiter aus
          der Abteilung zuordnen.
        </div>
      ) : null}

      {done ? (
        <div className="mb-5 rounded-[var(--radius)] border border-[var(--ok)]/30 bg-[var(--ok-soft)] px-4 py-3 text-sm text-[var(--ok)]">
          <strong>Erledigt</strong> · benötigte Zeit:{" "}
          <strong>{formatDuration(task.timeSpentMinutes)}</strong>
          {task.completedAt ? ` · ${formatDateTime(task.completedAt)}` : ""}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusPill tone="accent">{taskTypeLabel[task.type]}</StatusPill>
        <StatusPill>{dept?.name}</StatusPill>
        {task.revisionStand ? (
          <StatusPill tone="ok">Stand {task.revisionStand}</StatusPill>
        ) : null}
        {task.timeSpentMinutes != null && task.timeSpentMinutes > 0 ? (
          <StatusPill tone="ok">Dauer {formatDuration(task.timeSpentMinutes)}</StatusPill>
        ) : null}
        {task.flowId ? (
          <Link href="/flows">
            <StatusPill tone="accent">
              Flow:{" "}
              {state.flows?.find((f) => f.id === task.flowId)?.name ?? "aktiv"}
            </StatusPill>
          </Link>
        ) : null}
        {waiting ? <StatusPill tone="warn">Zuweisung offen</StatusPill> : null}
        {creator ? (
          <span className="text-sm text-[var(--ink-muted)]">
            Eingestellt von {creator.name}
          </span>
        ) : null}
      </div>

      {showComplete ? (
        <CompleteTaskForm
          task={task}
          onConfirm={completeWithTime}
          onCancel={() => setShowComplete(false)}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          {(task.checklist?.length ?? 0) > 0 ? (
            <Panel title="Checkliste (Pflicht vor Abschluss)">
              <p className="mb-3 text-sm text-[var(--ink-muted)]">
                Agenten und Flows verlangen standardisierte Schritte – erst dann
                kann der Auftrag erledigt werden
                {task.flowId ? " und der nächste Flow-Schritt starten" : ""}.
              </p>
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
              <p className="mt-3 text-xs text-[var(--ink-subtle)]">
                {task.checklist!.filter((c) => c.done).length}/
                {task.checklist!.length} erledigt
              </p>
            </Panel>
          ) : null}

          {waiting ? (
            <Panel title={`Mitarbeiter zuweisen · ${dept?.name}`}>
              <p className="mb-3 text-sm text-[var(--ink-muted)]">
                Abt.-Leiter-Agent schlägt nach Skills und Kapazität vor – Mensch
                entscheidet.
              </p>
              {agentSuggestions.length > 0 ? (
                <div className="mb-4 rounded-[var(--radius)] border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-3 py-2.5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                    Agent-Empfehlung Top 3
                  </p>
                  <ul className="space-y-2">
                    {agentSuggestions.map((s, i) => (
                      <li
                        key={s.user.id}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--ink)]">
                            {i + 1}. {s.user.name}
                          </p>
                          <p className="text-xs text-[var(--ink-muted)]">
                            Score {Math.round(s.score)} ·{" "}
                            {s.reasons.slice(0, 2).join(" · ")}
                          </p>
                        </div>
                        <Button onClick={() => assignTo(s.user.id)}>
                          Zuordnen
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <ul className="mb-4 space-y-2">
                {candidates.map(({ user, skillScore }) => (
                  <li
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {user.roleLabel} · Auslastung {user.capacityPercent}%
                        {skillScore > 0 ? ` · Skill-Score ${skillScore}` : ""}
                      </p>
                    </div>
                    <Button variant="secondary" onClick={() => assignTo(user.id)}>
                      Zuordnen
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[200px] flex-1">
                  <Field label="Oder manuell wählen">
                    <select
                      className={inputClass}
                      value={pickId}
                      onChange={(e) => setPickId(e.target.value)}
                    >
                      <option value="">—</option>
                      {candidates.map(({ user }) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Button
                  variant="secondary"
                  disabled={!pickId}
                  onClick={() => pickId && assignTo(pickId)}
                >
                  Übernehmen
                </Button>
              </div>
            </Panel>
          ) : null}

          <Panel title="Details">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--ink-subtle)]">Status</dt>
                <dd className="mt-1">
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
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Zugewiesen</dt>
                <dd className="mt-1">
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
                    <option value="">— Zuweisung offen —</option>
                    {candidates.map(({ user }) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                    {assignee && !candidates.some((c) => c.user.id === assignee.id) ? (
                      <option value={assignee.id}>{assignee.name}</option>
                    ) : null}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Programm</dt>
                <dd className="mt-1 font-medium">
                  <Link href={`/projects/${project?.id}`} className="hover:text-[var(--accent)]">
                    {project?.customer} · {project?.code}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Bauteil</dt>
                <dd className="mt-1 font-medium">
                  {part ? (
                    <Link
                      href={`/parts/${part.id}${task.revisionStand ? `?stand=${task.revisionStand}` : ""}`}
                      className="hover:text-[var(--accent)]"
                    >
                      {part.partNumber} – {part.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Fällig</dt>
                <dd className="mt-1">{formatDate(task.dueDate)}</dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Fortschritt</dt>
                <dd className="mt-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={task.progress}
                    onChange={(e) =>
                      updateTask(task.id, { progress: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                  <span className="text-[var(--ink-muted)]">{task.progress} %</span>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Gestartet</dt>
                <dd className="mt-1">
                  {task.startedAt ? formatDateTime(task.startedAt) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Benötigte Zeit</dt>
                <dd className="mt-1 font-medium">
                  {task.timeSpentMinutes != null && task.timeSpentMinutes > 0
                    ? formatDuration(task.timeSpentMinutes)
                    : "noch nicht dokumentiert"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              {task.type === "entwicklungsschleife" && part ? (
                <Button
                  onClick={() => {
                    const rev = startDevelopmentLoop(
                      part.id,
                      `Aus Auftrag ${task.title}`,
                    );
                    updateTask(task.id, {
                      status: "in_bearbeitung",
                      progress: 20,
                      startedAt: task.startedAt ?? new Date().toISOString(),
                    });
                    if (rev) {
                      window.location.href = `/parts/${part.id}?stand=${rev.revision}`;
                    }
                  }}
                >
                  Stand / Schleife am Bauteil starten
                </Button>
              ) : null}
              {!isDoneStatus(task.status) || !task.timeSpentMinutes ? (
                <Button onClick={() => setShowComplete(true)}>
                  Als erledigt markieren
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setShowReject((v) => !v)}>
                Auftrag ablehnen
              </Button>
              <div className="flex items-center gap-2 pl-2">
                {task.risk ? <AmpelBadge ampel={task.risk} /> : null}
                <StatusPill>{task.priority}</StatusPill>
              </div>
            </div>

            {showReject ? (
              <div className="mt-4 rounded-lg border border-[var(--danger-soft)] bg-[var(--danger-soft)]/40 p-4">
                <Field label="Begründung (Vorgesetzter wird informiert)">
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="z. B. keine Kapazität / Qualifikation fehlt"
                  />
                </Field>
                <div className="mt-3">
                  <Button
                    variant="danger"
                    onClick={() => {
                      updateTask(task.id, {
                        status: "abgelehnt",
                        rejectReason: rejectReason || "Abgelehnt ohne Begründung",
                      });
                      setShowReject(false);
                    }}
                  >
                    Ablehnung speichern
                  </Button>
                </div>
              </div>
            ) : null}

            {task.rejectReason ? (
              <p className="mt-4 text-sm text-[var(--danger)]">
                Ablehnungsgrund: {task.rejectReason}
              </p>
            ) : null}
          </Panel>

          <TaskLopPanel task={task} />

          <TaskProfilePanel task={task} />
        </div>

        <div className="space-y-6">
          <Panel title="Delegation">
            <ol className="space-y-3 text-sm">
              <li className="flex gap-2">
                <StatusPill tone="ok">1</StatusPill>
                <span>
                  Auftrag eingestellt
                  {creator ? ` (${creator.name})` : ""}
                </span>
              </li>
              <li className="flex gap-2">
                <StatusPill tone={waiting ? "warn" : "ok"}>2</StatusPill>
                <span>Abteilung {dept?.name}</span>
              </li>
              <li className="flex gap-2">
                <StatusPill tone={assignee ? "ok" : "neutral"}>3</StatusPill>
                <span>
                  Zuordnung
                  {assignee ? `: ${assignee.name}` : " (offen)"}
                </span>
              </li>
              <li className="flex gap-2">
                <StatusPill tone={task.startedAt ? "ok" : "neutral"}>4</StatusPill>
                <span>Bearbeitung{task.startedAt ? " gestartet" : ""}</span>
              </li>
              <li className="flex gap-2">
                <StatusPill tone={done ? "ok" : "neutral"}>5</StatusPill>
                <span>
                  Erledigt + Zeit
                  {done ? `: ${formatDuration(task.timeSpentMinutes)}` : ""}
                </span>
              </li>
            </ol>
          </Panel>

          <Panel title="Foto-Dokumentation">
            <div className="grid grid-cols-2 gap-3">
              {["Muster", "Nahtbild", "Detail", "Vergleich"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--bg-elevated)] text-sm text-[var(--ink-subtle)]"
                >
                  <span className="mb-1 text-2xl">＋</span>
                  {label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Chronik">
            <p className="mb-3 text-xs text-[var(--ink-muted)]">
              Zuweisungen und Änderungen sind dokumentiert – wer hat wann was gemacht.
            </p>
            <ul className="space-y-0">
              {[...(task.history ?? [])]
                .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                .map((h) => (
                  <li
                    key={h.id}
                    className="relative border-l border-[var(--line-strong)] pb-4 pl-4 last:pb-0"
                  >
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--accent)] bg-[var(--surface)]" />
                    <p className="text-sm font-medium text-[var(--ink)]">{h.action}</p>
                    {h.detail ? (
                      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{h.detail}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-[var(--ink-subtle)]">
                      {getUser(h.actorUserId)?.name ?? "System"} · {formatDateTime(h.at)}
                    </p>
                  </li>
                ))}
              {(task.history?.length ?? 0) === 0 ? (
                <li className="text-sm text-[var(--ink-subtle)]">Noch keine Chronik-Einträge.</li>
              ) : null}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
