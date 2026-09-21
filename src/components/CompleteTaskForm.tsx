"use client";

import { useMemo, useState } from "react";
import { Button, Field, Panel, inputClass } from "@/components/ui";
import { formatDuration } from "@/lib/labels";
import type { Task } from "@/lib/types";

const DONE_STATUSES = new Set(["erledigt", "abgeschlossen"]);

/** Geschätzte Minuten aus Start/Erstellung bis jetzt */
export function suggestMinutesFromTask(task: Task): number {
  const start = task.startedAt ?? task.createdAt;
  const end = Date.now();
  const diff = Math.max(0, Math.round((end - new Date(start).getTime()) / 60000));
  return Math.min(diff || 30, 60 * 24 * 14); // Cap 14 Tage
}

export function CompleteTaskForm({
  task,
  onConfirm,
  onCancel,
}: {
  task: Task;
  onConfirm: (timeSpentMinutes: number) => void;
  onCancel: () => void;
}) {
  const suggested = useMemo(() => suggestMinutesFromTask(task), [task]);
  const [hours, setHours] = useState(Math.floor(suggested / 60));
  const [minutes, setMinutes] = useState(suggested % 60);

  const total = Math.max(0, hours * 60 + minutes);

  return (
    <Panel title="Zeit dokumentieren" className="mb-4">
      <p className="mb-3 text-sm text-[var(--ink-muted)]">
        Bei Erledigung wird die benötigte Zeit festgehalten – unabhängig vom Auftragstyp. So sieht
        man später, wie lange Näh-, CAD- oder Schnittaufträge dauern.
      </p>
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <Field label="Stunden">
          <input
            type="number"
            min={0}
            max={200}
            className={inputClass}
            value={hours}
            onChange={(e) => setHours(Math.max(0, Number(e.target.value) || 0))}
          />
        </Field>
        <Field label="Minuten">
          <input
            type="number"
            min={0}
            max={59}
            className={inputClass}
            value={minutes}
            onChange={(e) =>
              setMinutes(Math.min(59, Math.max(0, Number(e.target.value) || 0)))
            }
          />
        </Field>
      </div>
      <p className="mb-3 text-sm text-[var(--ink)]">
        Dokumentierte Dauer: <strong>{formatDuration(total)}</strong>
        {suggested > 0 ? (
          <span className="text-[var(--ink-muted)]">
            {" "}
            (Vorschlag aus Start: {formatDuration(suggested)})
          </span>
        ) : null}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={total <= 0}
          onClick={() => {
            if (total <= 0) return;
            onConfirm(total);
          }}
        >
          Erledigen & Zeit speichern
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setHours(Math.floor(suggested / 60));
            setMinutes(suggested % 60);
          }}
        >
          Vorschlag übernehmen
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </Panel>
  );
}

export function isDoneStatus(status: string): boolean {
  return DONE_STATUSES.has(status);
}
