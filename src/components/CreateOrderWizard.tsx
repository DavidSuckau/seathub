"use client";

import { useMemo, useState } from "react";
import { Button, Field, Panel, StatusPill, inputClass } from "@/components/ui";
import { taskTypeLabel } from "@/lib/labels";
import {
  createOrderTileTypes,
  orderPreferredSkills,
  orderTypeDepartment,
  orderTypeHint,
  orderTypeTileMeta,
} from "@/lib/orders";
import { useStore } from "@/lib/store";
import type { Part, Task, TaskType } from "@/lib/types";

type ViewMode = "kacheln" | "liste";
type Priority = Task["priority"];

export function CreateOrderWizard({
  part,
  onCreated,
  onCancel,
  title = "Neuen Auftrag anlegen",
}: {
  /** Wenn gesetzt: Auftrag hängt am Bauteil */
  part?: Part;
  onCreated?: (task: Task) => void;
  onCancel?: () => void;
  title?: string;
}) {
  const { state, addTask, currentUser } = useStore();
  const [view, setView] = useState<ViewMode>("kacheln");
  const [type, setType] = useState<TaskType | null>(null);
  const [form, setForm] = useState({
    title: "",
    projectId: part?.projectId ?? state.projects[0]?.id ?? "",
    assigneeId: "",
    priority: "hoch" as Priority,
    dueDate: "2026-09-30",
    description: "",
  });

  const types = createOrderTileTypes;
  const departmentId = type ? orderTypeDepartment[type] : undefined;
  const dept = departmentId
    ? state.departments.find((d) => d.id === departmentId)
    : undefined;

  const candidates = useMemo(() => {
    if (!type || !departmentId) return [];
    const preferred = orderPreferredSkills[type] ?? [];
    return state.users
      .filter((u) => u.departmentId === departmentId && u.demoRole !== "extern")
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
  }, [state.users, departmentId, type]);

  function selectType(t: TaskType) {
    setType(t);
    if (part) {
      setForm((f) => ({
        ...f,
        title: `${taskTypeLabel[t]} · ${part.partNumber} · Stand ${part.currentRevision}`,
        projectId: part.projectId,
      }));
    } else {
      setForm((f) => ({
        ...f,
        title: f.title.trim() ? f.title : taskTypeLabel[t],
      }));
    }
  }

  function submit() {
    if (!type) return;
    const title =
      form.title.trim() ||
      (part
        ? `${taskTypeLabel[type]} · ${part.partNumber}`
        : taskTypeLabel[type]);
    if (!title) return;
    const project = state.projects.find((p) => p.id === form.projectId);
    const created = addTask({
      title,
      type,
      status: "offen",
      projectId: form.projectId,
      partId: part?.id,
      revisionStand: part?.currentRevision,
      departmentId: orderTypeDepartment[type],
      createdByUserId: state.currentUserId,
      needsAssignment: !form.assigneeId,
      assigneeId: form.assigneeId || undefined,
      priority: form.priority,
      dueDate: form.dueDate,
      progress: 0,
      description:
        form.description.trim() ||
        (part
          ? `${taskTypeLabel[type]} für ${part.name} (${part.partNumber}) in Programm ${project?.code ?? ""}. Stand ${part.currentRevision}. Eingestellt von ${currentUser?.name ?? "User"}.`
          : `${taskTypeLabel[type]} – eingestellt von ${currentUser?.name ?? "User"}.`),
    });
    onCreated?.(created);
    window.location.href = `/tasks/${created.id}`;
  }

  return (
    <Panel title={title} className="mb-6 animate-fade-up">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--ink-muted)]">
          {part
            ? "Typ wählen → Auftrag geht an die passende Abteilung."
            : "Auftragstyp anklicken – danach Details ergänzen."}
        </p>
        <div className="flex rounded-full bg-[var(--bg-elevated)] p-0.5">
          <button
            type="button"
            onClick={() => setView("kacheln")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              view === "kacheln"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow)]"
                : "text-[var(--ink-muted)]"
            }`}
          >
            Kacheln
          </button>
          <button
            type="button"
            onClick={() => setView("liste")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              view === "liste"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow)]"
                : "text-[var(--ink-muted)]"
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      {view === "kacheln" ? (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {types.map((t) => {
            const meta = orderTypeTileMeta[t];
            const selected = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => selectType(t)}
                className={`flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border p-4 text-left transition ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/30"
                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-[var(--radius)] text-lg font-bold tracking-tight ${
                    selected
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--accent)]"
                  }`}
                  aria-hidden
                >
                  {meta.icon}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[var(--ink)]">
                    {meta.shortLabel}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--ink-subtle)]">
                    {meta.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mb-5">
          <Field label="Auftragstyp">
            <select
              className={inputClass}
              value={type ?? ""}
              onChange={(e) => {
                const t = e.target.value as TaskType;
                if (t) selectType(t);
              }}
            >
              <option value="">— Typ wählen —</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {taskTypeLabel[t]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {type ? (
        <div className="space-y-4 border-t border-[var(--line)] pt-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusPill tone="accent">{taskTypeLabel[type]}</StatusPill>
            <span className="text-[var(--ink-muted)]">→ {dept?.name}</span>
          </div>
          {orderTypeHint[type] ? (
            <p className="text-xs text-[var(--ink-subtle)]">{orderTypeHint[type]}</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titel">
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            {!part ? (
              <Field label="Programm">
                <select
                  className={inputClass}
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.customer} · {p.code}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Bauteil">
                <div className="flex h-[42px] items-center rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 text-sm">
                  <span className="font-mono text-[var(--accent)]">{part.partNumber}</span>
                  <span className="text-[var(--ink-subtle)]"> · Stand {part.currentRevision}</span>
                </div>
              </Field>
            )}
            <Field label="Priorität">
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as Priority })
                }
              >
                <option value="niedrig">niedrig</option>
                <option value="normal">normal</option>
                <option value="hoch">hoch</option>
                <option value="kritisch">kritisch</option>
              </select>
            </Field>
            <Field label="Fällig">
              <input
                type="date"
                className={inputClass}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
            <Field label="Sofort zuweisen (optional)">
              <select
                className={inputClass}
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              >
                <option value="">— später durch Abteilung —</option>
                {candidates.map(({ user, skillScore }) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.capacityPercent}%
                    {skillScore > 0 ? ` · Skill ${skillScore}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Beschreibung">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={submit}>Auftrag einstellen</Button>
            {onCancel ? (
              <Button variant="ghost" onClick={onCancel}>
                Abbrechen
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-subtle)]">
          Zuerst einen Auftragstyp {view === "kacheln" ? "als Kachel" : "in der Liste"} wählen.
        </p>
      )}
    </Panel>
  );
}
