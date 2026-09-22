"use client";

import Link from "next/link";
import { useState } from "react";
import { LopPhotoGallery } from "@/components/LopPhotoGallery";
import { Button, Field, Modal, Panel, StatusPill, inputClass } from "@/components/ui";
import { lopSourceLabel, lopStatusLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { DepartmentId, LopSource, Task } from "@/lib/types";

const sources = Object.keys(lopSourceLabel) as LopSource[];

function defaultSource(task: Task): LopSource {
  const map: Partial<Record<string, LopSource>> = {
    naeherei: "naeherei",
    polsterei: "polsterei",
    dokumentation: "dokumentation",
    engineering: "engineering",
    schnittentwicklung: "entwicklung",
    musterbau: "intern",
  };
  return map[task.departmentId] ?? "intern";
}

export function TaskLopPanel({ task }: { task: Task }) {
  const { state, addLop, currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<LopSource>(() => defaultSource(task));
  const [photos, setPhotos] = useState<string[]>([]);

  const related = state.lops.filter(
    (l) =>
      l.taskId === task.id ||
      (task.partId && l.partId === task.partId && l.projectId === task.projectId),
  );

  function submit() {
    if (!title.trim() || !task.partId) return;
    const deptId = (task.departmentId || "engineering") as DepartmentId;
    const created = addLop({
      title: title.trim(),
      description:
        description.trim() ||
        `Aus Auftrag: ${task.title}`,
      source,
      status: "offen",
      projectId: task.projectId,
      partId: task.partId,
      taskId: task.id,
      departmentIds: [deptId],
      assigneeIds: [state.currentUserId],
      createdByUserId: state.currentUserId,
      dueDate: task.dueDate,
      photos,
    });
    setOpen(false);
    setTitle("");
    setDescription("");
    setPhotos([]);
    window.location.href = `/lops/${created.id}`;
  }

  return (
    <Panel title="LOPs zu diesem Auftrag">
      <p className="mb-3 text-sm text-[var(--ink-muted)]">
        Zugeordnete Punkte anklicken zum Öffnen. Neuen Punkt direkt hier anlegen
        {currentUser ? ` (als ${currentUser.name})` : ""}.
      </p>

      {related.length > 0 ? (
        <ul className="mb-4 divide-y divide-[var(--line)]">
          {related.map((l) => (
            <li key={l.id}>
              <Link
                href={`/lops/${l.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3 transition hover:bg-[var(--bg-elevated)]"
              >
                <div>
                  <p className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
                    {l.title}
                  </p>
                  <p className="text-xs text-[var(--ink-subtle)]">
                    {lopSourceLabel[l.source]}
                    {l.taskId === task.id ? " · aus diesem Auftrag" : " · gleiches Bauteil"}
                    {(l.photos?.length ?? 0) > 0
                      ? ` · ${l.photos!.length} Foto(s)`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={l.status === "geschlossen" ? "ok" : "warn"}>
                    {lopStatusLabel[l.status]}
                  </StatusPill>
                  <span className="text-xs font-medium text-[var(--accent)]">Öffnen →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-[var(--ink-subtle)]">Noch keine LOPs hier.</p>
      )}

      {!task.partId ? (
        <p className="text-xs text-[var(--warn)]">
          Auftrag ohne Bauteil – LOP erst möglich, wenn eine Teilenummer verknüpft ist.
        </p>
      ) : !open ? (
        <Button onClick={() => setOpen(true)}>LOP-Punkt anlegen</Button>
      ) : (
        <Modal title="LOP-Punkt anlegen" size="md" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="Titel">
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. Nahtbild nicht akzeptabel"
              />
            </Field>
            <Field label="Quelle">
              <select
                className={inputClass}
                value={source}
                onChange={(e) => setSource(e.target.value as LopSource)}
              >
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {lopSourceLabel[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Beschreibung">
              <textarea
                className={inputClass}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurz was das Problem / der Punkt ist"
              />
            </Field>
            <Field label="Fotos (optional)">
              <LopPhotoGallery photos={photos} editable onChange={setPhotos} />
            </Field>
            <p className="text-xs text-[var(--ink-subtle)]">
              Programm und Bauteil werden vom Auftrag übernommen.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={!title.trim()}>
                LOP speichern
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setPhotos([]);
                }}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Panel>
  );
}
