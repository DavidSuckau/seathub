"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CreateProgramWizard } from "@/components/CreateProgramWizard";
import { CreateSimpleProjectForm } from "@/components/CreateSimpleProjectForm";
import {
  type ArtFilter,
  ArtFilterLayout,
  ModuleKindFilter,
  partMatchesArt,
} from "@/components/ModuleKindFilter";
import { ProgressBar } from "@/components/ProgressBar";
import { AmpelBadge, Button, Modal, PageHeader, Panel, StatusPill } from "@/components/ui";
import { projectStatusLabel, formatDate } from "@/lib/labels";
import { projectReleaseProgress } from "@/lib/progress";
import { useStore } from "@/lib/store";
import { equipmentLabels, getChildren, supplyScopeLabel } from "@/lib/structure";
import type { ModuleKind } from "@/lib/types";

export default function ProjectsPage() {
  const { state } = useStore();
  const [artFilter, setArtFilter] = useState<ArtFilter>("alle");
  const [showWizard, setShowWizard] = useState(false);

  const availableArts = useMemo(() => {
    const set = new Set<ModuleKind>();
    for (const p of state.parts) {
      if (p.moduleKind) set.add(p.moduleKind);
    }
    return Array.from(set);
  }, [state.parts]);

  const byCustomer = useMemo(() => {
    const map = new Map<string, typeof state.projects>();
    for (const p of state.projects) {
      const parts = state.parts.filter(
        (part) => part.projectId === p.id && partMatchesArt(part, artFilter),
      );
      if (artFilter !== "alle" && parts.length === 0) continue;
      const list = map.get(p.customer) ?? [];
      list.push(p);
      map.set(p.customer, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [state.projects, state.parts, artFilter]);

  return (
    <div>
      <PageHeader
        eyebrow="Projekt → Bauteile → Struktur wächst"
        title="Projekte"
        description="Erst ein Projekt anlegen, dann Bauteile je Kategorie. Sitzreihen entstehen mit den Bauteilen."
        actions={
          <div className="flex flex-wrap gap-2">
            <CreateSimpleProjectForm />
            <Button variant="secondary" onClick={() => setShowWizard(true)}>
              Großer Assistent
            </Button>
          </div>
        }
      />

      {showWizard ? (
        <Modal
          title="Programm-Assistent (erweitert)"
          size="xl"
          onClose={() => setShowWizard(false)}
        >
          <CreateProgramWizard
            embedded
            onCancel={() => setShowWizard(false)}
          />
        </Modal>
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
      <div className="space-y-8">
        {byCustomer.length === 0 ? (
          <p className="text-sm text-[var(--ink-subtle)]">
            Keine Programme mit Bauteilen dieser Art.
          </p>
        ) : null}
        {byCustomer.map(([customer, programs]) => (
          <section key={customer}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--ink)]">{customer}</h2>
              <span className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
                {programs.length} Programm{programs.length === 1 ? "" : "e"}
              </span>
            </div>
            <div className="grid gap-3">
              {programs.map((p) => {
                const tasks = state.tasks.filter((t) => t.projectId === p.id);
                const lops = state.lops.filter(
                  (l) => l.projectId === p.id && l.status !== "geschlossen",
                );
                const parts = state.parts.filter(
                  (part) => part.projectId === p.id && partMatchesArt(part, artFilter),
                );
                const rows = getChildren(state.structureNodes, p.id, null);
                const progress = projectReleaseProgress(parts);
                const equip = equipmentLabels(p.equipment);
                return (
                  <Link key={p.id} href={`/projects/${p.id}`}>
                    <Panel className="transition hover:border-[var(--accent)] hover:shadow-[var(--shadow-md)]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[var(--ink-subtle)]">
                            Programm{" "}
                            <span className="font-mono text-[var(--accent)]">{p.code}</span>
                          </p>
                          <h3 className="mt-1 text-xl font-semibold tracking-tight">{p.name}</h3>
                          <p className="mt-1.5 max-w-2xl text-sm text-[var(--ink-muted)]">
                            {p.description}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--ink-muted)]">
                            <StatusPill tone="accent">{projectStatusLabel[p.status]}</StatusPill>
                            <StatusPill tone="ok">{supplyScopeLabel[p.supplyScope]}</StatusPill>
                            {p.sopDate ? (
                              <StatusPill tone="accent">SOP {formatDate(p.sopDate)}</StatusPill>
                            ) : null}
                            {p.includesHeadrest != null ? (
                              <StatusPill>
                                {p.includesHeadrest ? "mit Kopfstütze" : "ohne Kopfstütze"}
                              </StatusPill>
                            ) : null}
                            <span>
                              {rows.length} Sitzreihe{rows.length === 1 ? "" : "n"}
                            </span>
                            <span>
                              {parts.length} Bauteil{parts.length === 1 ? "" : "e"}
                              {artFilter !== "alle" ? " (Filter)" : ""}
                            </span>
                            <span>{tasks.length} Aufträge</span>
                            <span>{lops.length} LOPs</span>
                          </div>
                          {equip.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {equip.map((label) => (
                                <span
                                  key={label}
                                  className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--ink-muted)]"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {rows.length > 0 ? (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {rows.map((r) => (
                                <span
                                  key={r.id}
                                  className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--ink-muted)]"
                                >
                                  {r.label}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="w-full max-w-[220px] shrink-0 sm:w-52">
                          <div className="mb-2 flex justify-end">
                            <AmpelBadge ampel={p.ampel} />
                          </div>
                          <ProgressBar
                            percent={progress.percent}
                            label="Freigabe-Fortschritt"
                            detail={`${progress.released}/${progress.total} Bauteile`}
                          />
                          {progress.withActiveLoop > 0 ? (
                            <p className="mt-1 text-[11px] text-[var(--ink-subtle)]">
                              davon {progress.withActiveLoop} in Weiterentwicklung
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Panel>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      </ArtFilterLayout>
    </div>
  );
}
