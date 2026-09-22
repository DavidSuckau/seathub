"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Field,
  FilterChip,
  Modal,
  PageHeader,
  Panel,
  StatusPill,
  inputClass,
} from "@/components/ui";
import { navigate } from "@/lib/nav";
import {
  type ArtFilter,
  ArtFilterLayout,
  ModuleKindFilter,
  partMatchesArt,
} from "@/components/ModuleKindFilter";
import { LopPhotoGallery } from "@/components/LopPhotoGallery";
import { formatDate, lopSourceLabel, lopStatusLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { DepartmentId, LopSource, ModuleKind } from "@/lib/types";

const sources = Object.keys(lopSourceLabel) as LopSource[];

export default function LopsPage() {
  const { state, addLop, currentUser } = useStore();
  const isManager = state.demoRole === "manager";
  /** Mitarbeiter: standard nur eigene; ein Klick → alle */
  const [scope, setScope] = useState<"meine" | "alle">(isManager ? "alle" : "meine");
  const [sourceFilter, setSourceFilter] = useState<string>("alle");
  const [artFilter, setArtFilter] = useState<ArtFilter>("alle");
  const [showForm, setShowForm] = useState(false);
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    source: "naeherei" as LopSource,
    projectId: state.projects[0]?.id ?? "",
    partId: state.parts[0]?.id ?? "",
    departmentId: "engineering" as DepartmentId,
    assigneeId: state.currentUserId,
  });

  useEffect(() => {
    setScope(state.demoRole === "manager" ? "alle" : "meine");
  }, [state.demoRole, state.currentUserId]);

  const myLops = useMemo(
    () => state.lops.filter((l) => l.assigneeIds.includes(state.currentUserId)),
    [state.lops, state.currentUserId],
  );

  const scopedLops = scope === "meine" ? myLops : state.lops;

  const availableArts = useMemo(() => {
    const set = new Set<ModuleKind>();
    for (const l of scopedLops) {
      const part = state.parts.find((p) => p.id === l.partId);
      if (part?.moduleKind) set.add(part.moduleKind);
    }
    return Array.from(set);
  }, [scopedLops, state.parts]);

  const filtered = useMemo(() => {
    let list = scopedLops;
    if (artFilter !== "alle") {
      list = list.filter((l) => {
        const part = state.parts.find((p) => p.id === l.partId);
        if (!part) return false;
        return partMatchesArt(part, artFilter);
      });
    }
    if (sourceFilter === "alle") return list;
    return list.filter((l) => l.source === sourceFilter);
  }, [scopedLops, sourceFilter, artFilter, state.parts]);

  const bySource = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of filtered) {
      if (l.status === "geschlossen") continue;
      map[l.source] = (map[l.source] ?? 0) + 1;
    }
    return map;
  }, [filtered]);

  function submit() {
    if (!form.title.trim() || !form.partId) return;
    const created = addLop({
      title: form.title.trim(),
      description: form.description,
      source: form.source,
      status: "offen",
      projectId: form.projectId,
      partId: form.partId,
      departmentIds: [form.departmentId],
      assigneeIds: [form.assigneeId],
      createdByUserId: state.currentUserId,
      dueDate: "2026-09-30",
      photos: formPhotos,
    });
    setShowForm(false);
    setFormPhotos([]);
    navigate(`/lops/${created.id}`);
  }

  const partsForProject = state.parts
    .filter((p) => p.projectId === form.projectId)
    .sort((a, b) => a.partNumber.localeCompare(b.partNumber));

  return (
    <div>
      <PageHeader
        eyebrow="Arbeitsplatz"
        title="LOPs"
        description={
          scope === "meine"
            ? "Deine offenen Punkte – abhaken und erledigen."
            : "Überblick über offene Punkte im Team / System."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {!isManager || scope === "meine" ? (
              <Button
                variant={scope === "meine" ? "secondary" : "ghost"}
                onClick={() => setScope(scope === "meine" ? "alle" : "meine")}
              >
                {scope === "meine" ? "Team / alle" : "Nur meine"}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setScope("meine")}>
                Nur meine
              </Button>
            )}
            <Button onClick={() => setShowForm(true)}>LOP anlegen</Button>
          </div>
        }
      />

      {showForm ? (
        <Modal title="Neuen LOP anlegen" size="lg" onClose={() => setShowForm(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titel">
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="z. B. Nahtbild Kopfstütze nicht akzeptabel"
              />
            </Field>
            <Field label="Quelle">
              <select
                className={inputClass}
                value={form.source}
                onChange={(e) =>
                  setForm({ ...form, source: e.target.value as LopSource })
                }
              >
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {lopSourceLabel[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Projekt">
              <select
                className={inputClass}
                value={form.projectId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    projectId: e.target.value,
                    partId: "",
                  })
                }
              >
                {state.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Teilenummer *">
              <select
                className={inputClass}
                value={form.partId}
                onChange={(e) => setForm({ ...form, partId: e.target.value })}
              >
                <option value="">— Bauteil wählen —</option>
                {partsForProject.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partNumber}
                    {p.isVirtual ? " (virtuell)" : ""} – {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Zuständig">
              <select
                className={inputClass}
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              >
                {state.users
                  .filter((u) => u.demoRole !== "extern")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Beschreibung">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Fotos">
                <LopPhotoGallery
                  photos={formPhotos}
                  editable
                  onChange={setFormPhotos}
                />
              </Field>
            </div>
          </div>
          {!form.partId ? (
            <p className="mt-3 text-xs text-[var(--warn)]">Teilenummer ist Pflicht.</p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button onClick={submit} disabled={!form.partId || !form.title.trim()}>
              LOP speichern
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Abbrechen
            </Button>
          </div>
        </Modal>
      ) : null}

      {scope === "meine" ? (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
          Ansicht: <strong>meine LOPs</strong> ({myLops.length}). Mit einem Klick oben auf{" "}
          <strong>Alle LOPs anzeigen</strong> die gesamte Liste.
        </div>
      ) : !isManager ? (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Du siehst gerade <strong>alle</strong> LOPs.{" "}
          <button
            type="button"
            className="font-medium text-[var(--accent)] underline"
            onClick={() => setScope("meine")}
          >
            Zurück zu meinen
          </button>
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
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(bySource).map(([source, count]) => (
          <button
            key={source}
            type="button"
            onClick={() => setSourceFilter(source)}
            className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-left shadow-[var(--shadow)] transition hover:border-[var(--accent)]"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
              {lopSourceLabel[source as LopSource] ?? source}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">{count}</p>
            <p className="text-xs text-[var(--ink-muted)]">offen</p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1">
        <FilterChip
          active={sourceFilter === "alle"}
          onClick={() => setSourceFilter("alle")}
        >
          Alle Quellen
        </FilterChip>
      </div>

      <Panel>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--ink-subtle)]">
            {scope === "meine"
              ? "Dir sind keine LOPs zugeordnet."
              : "Keine LOPs in diesem Filter."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {filtered.map((l) => {
              const project = state.projects.find((p) => p.id === l.projectId);
              const mine = l.assigneeIds.includes(state.currentUserId);
              return (
                <li key={l.id}>
                  <Link
                    href={`/lops/${l.id}`}
                    className="flex flex-col gap-2 py-4 transition hover:bg-[var(--bg-elevated)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{l.title}</p>
                      <p className="text-sm text-[var(--ink-muted)]">
                        {lopSourceLabel[l.source]} · {project?.name} ·{" "}
                        {formatDate(l.createdAt)}
                        {(l.photos?.length ?? 0) > 0
                          ? ` · ${l.photos!.length} Foto${l.photos!.length === 1 ? "" : "s"}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {mine && scope === "alle" ? (
                        <StatusPill tone="accent">mir zugeordnet</StatusPill>
                      ) : null}
                      <StatusPill tone={l.status === "geschlossen" ? "ok" : "warn"}>
                        {lopStatusLabel[l.status]}
                      </StatusPill>
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
