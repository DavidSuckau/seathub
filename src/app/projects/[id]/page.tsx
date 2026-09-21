"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CreatePartForm } from "@/components/CreatePartForm";
import { CreateStructureForm } from "@/components/CreateStructureForm";
import {
  type ArtFilter,
  ModuleKindFilter,
  partMatchesArt,
} from "@/components/ModuleKindFilter";
import { ProgressBar } from "@/components/ProgressBar";
import { ProjectStructureTree } from "@/components/ProjectStructureTree";
import { AmpelBadge, PageHeader, Panel, StatusPill } from "@/components/ui";
import {
  formatDate,
  formatDateTime,
  lopStatusLabel,
  projectStatusLabel,
  taskStatusLabel,
} from "@/lib/labels";
import { partReleaseState, projectReleaseProgress } from "@/lib/progress";
import { useStore } from "@/lib/store";
import { supplyScopeHint, supplyScopeLabel } from "@/lib/structure";
import type { ModuleKind } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, getUser } = useStore();
  const [standView, setStandView] = useState<"aktuell" | "alle">("aktuell");
  const [artFilter, setArtFilter] = useState<ArtFilter>("alle");
  const project = state.projects.find((p) => p.id === params.id);

  const projectParts = useMemo(
    () => (project ? state.parts.filter((p) => p.projectId === project.id) : []),
    [state.parts, project],
  );
  const filteredParts = useMemo(
    () => projectParts.filter((p) => partMatchesArt(p, artFilter)),
    [projectParts, artFilter],
  );
  const partsWithoutRelease = useMemo(
    () =>
      [...filteredParts]
        .filter((p) => partReleaseState(p) === "ohne_freigabe")
        .sort((a, b) => a.partNumber.localeCompare(b.partNumber)),
    [filteredParts],
  );
  const availableArts = useMemo(() => {
    const set = new Set<ModuleKind>();
    for (const p of projectParts) {
      if (p.moduleKind) set.add(p.moduleKind);
    }
    return Array.from(set);
  }, [projectParts]);

  if (!project) {
    return (
      <div>
        <PageHeader title="Projekt nicht gefunden" />
        <Link href="/projects">Zurück</Link>
      </div>
    );
  }

  const tasks = state.tasks.filter((t) => t.projectId === project.id);
  const lops = state.lops.filter((l) => l.projectId === project.id);
  const parts = filteredParts;
  const progress = projectReleaseProgress(parts);
  const chronicle = [
    ...state.activityLog.filter(
      (a) =>
        tasks.some((t) => t.id === a.entityId) ||
        lops.some((l) => l.id === a.entityId) ||
        state.revisions.some(
          (r) => r.id === a.entityId && parts.some((p) => p.id === r.partId),
        ),
    ),
  ].slice(0, 12);

  return (
    <div>
      <PageHeader
        eyebrow={`${project.customer} · Programm ${project.code}`}
        title={project.name}
        description={project.description}
        actions={<AmpelBadge ampel={project.ampel} />}
      />

      {project.milestoneRisk ? (
        <div className="mb-5 rounded-[var(--radius)] border border-[var(--warn)]/25 bg-[var(--warn-soft)] px-4 py-3 text-sm text-[var(--warn)]">
          <strong>{project.milestoneLabel}:</strong> {project.milestoneRisk}
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        <StatusPill tone="accent">{projectStatusLabel[project.status]}</StatusPill>
        <StatusPill tone="ok">{supplyScopeLabel[project.supplyScope]}</StatusPill>
        <StatusPill>{parts.length} Bauteile</StatusPill>
        <StatusPill tone="ok">
          Freigabe {progress.percent} % ({progress.released}/{progress.total})
        </StatusPill>
      </div>

      <p className="mb-5 max-w-3xl text-sm text-[var(--ink-muted)]">
        {supplyScopeHint[project.supplyScope]}
      </p>

      <Panel title="Gesamtfortschritt Freigabe" className="mb-6">
        <div className="max-w-md">
          <ProgressBar
            percent={progress.percent}
            label="Anteil Bauteile mit Freigabe"
            detail={`${progress.released} von ${progress.total}`}
          />
        </div>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Auch bei laufender Weiterentwicklung bleibt ein Bauteil mit Freigabe im Fortschritt.
          {progress.withActiveLoop > 0
            ? ` Aktuell ${progress.withActiveLoop} Bauteil(e) nach Freigabe in neuer Schleife.`
            : ""}
          {progress.withoutRelease > 0
            ? ` ${progress.withoutRelease} noch ohne Freigabe.`
            : ""}
        </p>
      </Panel>

      <div className="mb-4">
        <ModuleKindFilter
          value={artFilter}
          onChange={setArtFilter}
          available={availableArts}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <CreateStructureForm projectId={project.id} />
          <CreatePartForm projectId={project.id} />
        </div>
        <div className="flex rounded-full bg-[var(--bg-elevated)] p-0.5">
          <button
            type="button"
            onClick={() => setStandView("aktuell")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              standView === "aktuell"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow)]"
                : "text-[var(--ink-muted)]"
            }`}
          >
            Nur aktueller Stand
          </button>
          <button
            type="button"
            onClick={() => setStandView("alle")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              standView === "alle"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow)]"
                : "text-[var(--ink-muted)]"
            }`}
          >
            Alle Stände (01…n)
          </button>
        </div>
      </div>

      <div className="mb-6">
        <Panel title="Sitzstruktur, Module, Teilenummern & Stände">
          <ProjectStructureTree
            projectId={project.id}
            nodes={state.structureNodes}
            parts={state.parts}
            revisions={state.revisions}
            standView={standView}
            artFilter={artFilter}
            getUserName={(id) => (id ? getUser(id)?.name ?? "—" : "—")}
          />
        </Panel>
      </div>

      <Panel title="Bauteile ohne Freigabe" className="mb-6">
        <ul className="divide-y divide-[var(--line)]">
          {partsWithoutRelease.length === 0 ? (
            <li className="py-3 text-sm text-[var(--ink-subtle)]">
              Alle sichtbaren Bauteile haben eine Freigabe.
            </li>
          ) : (
            partsWithoutRelease.map((part) => (
              <li key={part.id}>
                <Link
                  href={`/parts/${part.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:bg-[var(--bg-elevated)]"
                >
                  <span>
                    <span className="font-mono text-[var(--accent)]">{part.partNumber}</span>
                    <span className="text-[var(--ink-subtle)]"> · </span>
                    {part.name}
                  </span>
                  <StatusPill tone="warn">
                    Ohne Freigabe · Stand {part.currentRevision}
                  </StatusPill>
                </Link>
              </li>
            ))
          )}
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Aufträge">
          <ul className="divide-y divide-[var(--line)]">
            {tasks.length === 0 ? (
              <li className="py-3 text-sm text-[var(--ink-subtle)]">Keine Aufträge.</li>
            ) : (
              tasks.map((t) => (
                <li key={t.id} className="py-3">
                  <Link href={`/tasks/${t.id}`} className="font-medium hover:text-[var(--accent)]">
                    {t.title}
                  </Link>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {taskStatusLabel[t.status]} · {getUser(t.assigneeId ?? "")?.name}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel title="LOPs">
          <ul className="divide-y divide-[var(--line)]">
            {lops.length === 0 ? (
              <li className="py-3 text-sm text-[var(--ink-subtle)]">Keine LOPs.</li>
            ) : (
              lops.map((l) => (
                <li key={l.id} className="py-3">
                  <Link href={`/lops/${l.id}`} className="font-medium hover:text-[var(--accent)]">
                    {l.title}
                  </Link>
                  <p className="text-sm text-[var(--ink-muted)]">{lopStatusLabel[l.status]}</p>
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel title="Dokumente (Platzhalter)">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {["CAD", "Schnitt", "Prüfbericht", "Spezifikation"].map((d) => (
              <div
                key={d}
                className="rounded-lg border border-dashed border-[var(--line)] px-3 py-4 text-center text-[var(--ink-subtle)]"
              >
                {d}.pdf
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Verantwortliche (über Bauteile)">
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-1.5 text-xs font-medium text-[var(--ink-subtle)]">Ingenieure</p>
              <ul className="space-y-1">
                {Array.from(new Set(parts.map((p) => p.engineerUserId).filter(Boolean))).map(
                  (id) => (
                    <li key={id}>{getUser(id!)?.name}</li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-[var(--ink-subtle)]">Bezugsentwickler</p>
              <ul className="space-y-1">
                {Array.from(
                  new Set(parts.map((p) => p.coverDeveloperUserId).filter(Boolean)),
                ).map((id) => (
                  <li key={id}>{getUser(id!)?.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel title="Projektchronik" className="lg:col-span-2">
          <ul className="space-y-3">
            {chronicle.length === 0 ? (
              <li className="text-sm text-[var(--ink-subtle)]">Noch keine Chronik-Einträge.</li>
            ) : (
              chronicle.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap gap-3 border-b border-[var(--line)] pb-3 text-sm"
                >
                  <span className="w-36 text-[var(--ink-subtle)]">{formatDateTime(a.at)}</span>
                  <span className="font-medium">{a.action}</span>
                  <span className="text-[var(--ink-muted)]">{a.detail}</span>
                </li>
              ))
            )}
            <li className="flex flex-wrap gap-3 text-sm text-[var(--ink-muted)]">
              <span className="w-36">{formatDate("2026-09-14")}</span>
              <span>Struktur und Teilenummern im Programm angelegt</span>
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
