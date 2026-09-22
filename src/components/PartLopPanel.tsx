"use client";

import Link from "next/link";
import { useState } from "react";
import { LopPhotoGallery } from "@/components/LopPhotoGallery";
import { Button, Field, Modal, Panel, StatusPill, inputClass } from "@/components/ui";
import { lopSourceLabel, lopStatusLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { DepartmentId, LopSource, Part } from "@/lib/types";
import { navigate } from "@/lib/nav";

const sources = Object.keys(lopSourceLabel) as LopSource[];

export function PartLopPanel({
  part,
  className,
}: {
  part: Part;
  className?: string;
}) {
  const { state, addLop, currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<LopSource>("engineering");
  const [photos, setPhotos] = useState<string[]>([]);

  const related = state.lops.filter((l) => l.partId === part.id);

  function submit() {
    if (!title.trim()) return;
    const dept =
      (currentUser?.departmentId as DepartmentId | undefined) ?? "engineering";
    const created = addLop({
      title: title.trim(),
      description:
        description.trim() ||
        `Zum Bauteil ${part.partNumber} – ${part.name}`,
      source,
      status: "offen",
      projectId: part.projectId,
      partId: part.id,
      departmentIds: [dept],
      assigneeIds: [state.currentUserId],
      createdByUserId: state.currentUserId,
      photos,
    });
    setOpen(false);
    setTitle("");
    setDescription("");
    setPhotos([]);
    navigate(`/lops/${created.id}`);
  }

  return (
    <Panel title="LOPs zu diesem Bauteil" className={className}>
      <p className="mb-3 text-sm text-[var(--ink-muted)]">
        Offenen Punkt direkt am Bauteil anlegen – für alle Rollen
        {currentUser ? ` (als ${currentUser.name})` : ""}.
      </p>

      {related.length > 0 ? (
        <ul className="mb-4 divide-y divide-[var(--line)]">
          {related.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <Link
                  href={`/lops/${l.id}`}
                  className="font-medium text-[var(--ink)] hover:text-[var(--accent)]"
                >
                  {l.title}
                </Link>
                <p className="text-xs text-[var(--ink-subtle)]">
                  {lopSourceLabel[l.source]}
                  {(l.photos?.length ?? 0) > 0
                    ? ` · ${l.photos!.length} Foto(s)`
                    : ""}
                </p>
              </div>
              <StatusPill tone={l.status === "geschlossen" ? "ok" : "warn"}>
                {lopStatusLabel[l.status]}
              </StatusPill>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-[var(--ink-subtle)]">Noch keine LOPs an diesem Bauteil.</p>
      )}

      {!open ? (
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
            Programm und Bauteil ({part.partNumber}) werden übernommen.
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
