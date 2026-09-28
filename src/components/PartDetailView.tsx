"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AssemblyAddButton, CadOrderedPill, hasOpenCadOrder } from "@/components/AssemblyAddButton";
import { CreatePartOrderForm } from "@/components/CreatePartOrderForm";
import { DevelopmentLoopForm } from "@/components/DevelopmentLoopForm";
import { NextAction } from "@/components/NextAction";
import {
  ProfileUsagePanel,
  SharedImpactBanner,
} from "@/components/LinkExistingProfileForm";
import { PartLopPanel } from "@/components/PartLopPanel";
import { PartHauptbild, PartImageThumb } from "@/components/PartHauptbild";
import { BezugCutBomPanel } from "@/components/BezugCutBomPanel";
import { DxfViewerPanel } from "@/components/DxfViewer";
import { Button, Field, PageHeader, Panel, StatusPill, inputClass } from "@/components/ui";
import {
  navigateToPart,
  navigateToProject,
  navigateToTask,
  partPath,
  projectPath,
  taskPath,
} from "@/lib/nav";
import {
  getChildComponents,
  getUsedOnPartIds,
  isAssemblyPart,
  isSharedComponent,
} from "@/lib/components";
import { partAllowsChildren, rulesForPart } from "@/lib/module-rules";
import { CALENDAR_TODAY } from "@/lib/calendar";
import { demoDxfAttachment } from "@/lib/dxf-demo";
import { formatDate, formatDateTime, taskStatusLabel, taskTypeLabel } from "@/lib/labels";
import { partKindLabel } from "@/lib/orders";
import { formatWeightGrams } from "@/lib/progress";
import {
  getPartRevisions,
  revisionStatusLabel,
  revisionStatusTone,
} from "@/lib/revisions";
import { useStore } from "@/lib/store";
import {
  developmentRoleLabel,
  getNodePath,
  moduleContextHint,
  moduleKindLabel,
  sideLabel,
} from "@/lib/structure";
import { isDoneStatus } from "@/components/CompleteTaskForm";
import { openOrdersBlockingPart } from "@/lib/part-orders";

type PartTab = "uebersicht" | "auftraege" | "unterteile" | "staende" | "lops";

const BASE_TABS: { id: PartTab; label: string }[] = [
  { id: "uebersicht", label: "Übersicht" },
  { id: "auftraege", label: "Aufträge" },
  { id: "unterteile", label: "Unterteile" },
  { id: "staende", label: "Stände" },
  { id: "lops", label: "LOPs" },
];

function statusTone(
  status: string,
  needsAssignment?: boolean,
  assigneeId?: string,
): "warn" | "ok" | "accent" | "neutral" {
  if (needsAssignment || !assigneeId) return "warn";
  if (isDoneStatus(status)) return "ok";
  if (status === "in_bearbeitung" || status === "zur_pruefung") return "accent";
  return "neutral";
}

export function PartDetailView({ partId }: { partId: string }) {
  const searchParams = useSearchParams();
  const { state, relaunchStand, updateRevision, deletePart, updatePart, getProject, getUser } =
    useStore();
  const part = state.parts.find((p) => p.id === partId);
  const [showLoop, setShowLoop] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addHint, setAddHint] = useState<string | null>(null);

  const revisions = part ? getPartRevisions(state.revisions, part.id) : [];
  const standParam = searchParams.get("stand");
  const tabParam = searchParams.get("tab") as PartTab | null;
  const selectedStand =
    standParam && revisions.some((r) => r.revision === standParam)
      ? standParam
      : (part?.currentRevision ?? revisions[revisions.length - 1]?.revision);
  const selected = revisions.find((r) => r.revision === selectedStand);

  // Hinterlegte DXF am Stand sicherstellen – beim Öffnen des Bauteils sichtbar
  const dxfSeededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!part || !selected) return;
    if (selected.dxf?.content) {
      dxfSeededFor.current = selected.id;
      return;
    }
    if (dxfSeededFor.current === selected.id) return;
    dxfSeededFor.current = selected.id;
    updateRevision(selected.id, { dxf: demoDxfAttachment(part) });
  }, [part, selected, updateRevision]);

  if (!part) {
    return (
      <div>
        <PageHeader title="Bauteil nicht gefunden" />
        <Link href="/projects">Zu Projekten</Link>
      </div>
    );
  }

  const project = getProject(part.projectId);
  const engineer = part.engineerUserId ? getUser(part.engineerUserId) : undefined;
  const coverDev = part.coverDeveloperUserId ? getUser(part.coverDeveloperUserId) : undefined;
  const mirrorPair = part.mirrorPairPartId
    ? state.parts.find((p) => p.id === part.mirrorPairPartId)
    : undefined;
  const mirrorMaster = part.mirrorMasterPartId
    ? state.parts.find((p) => p.id === part.mirrorMasterPartId)
    : undefined;
  const role = part.developmentRole ?? "eigenstaendig";
  const childParts = getChildComponents(state.parts, part.id);
  const usedOnIds = getUsedOnPartIds(part);
  const parentAssemblies = usedOnIds
    .map((id) => state.parts.find((p) => p.id === id))
    .filter(Boolean);
  const allowsChildren = partAllowsChildren(part);
  const isBezugAssembly = isAssemblyPart(part);
  const moduleRules = rulesForPart(part);
  const shared = isSharedComponent(part);
  const partTasks = state.tasks
    .filter((t) => t.partId === part.id)
    .slice()
    .sort((a, b) => {
      const aDone = isDoneStatus(a.status) ? 1 : 0;
      const bDone = isDoneStatus(b.status) ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
  const openCount = partTasks.filter((t) => !isDoneStatus(t.status)).length;
  const blockingOrders = openOrdersBlockingPart(state.parts, state.tasks, part.id);
  const canRelease = blockingOrders.length === 0;
  const releasePartId = part.id;
  const releaseRevisionId = selected?.id;

  const availableTabs = BASE_TABS.filter((t) => {
    if (t.id === "unterteile") return allowsChildren;
    return true;
  }).map((t) =>
    t.id === "unterteile"
      ? { ...t, label: moduleRules.childrenTabLabel }
      : t,
  );
  const activeTab: PartTab =
    tabParam && availableTabs.some((t) => t.id === tabParam)
      ? tabParam
      : "auftraege";

  function tryRelease() {
    if (!releaseRevisionId) return;
    const result = relaunchStand(releasePartId, releaseRevisionId);
    if (!result.ok) {
      window.alert(result.reason);
    }
  }

  function tabHref(tab: PartTab) {
    return partPath(releasePartId, {
      stand: selectedStand,
      tab,
    });
  }

  function standHref(stand: string) {
    return partPath(releasePartId, { stand, tab: "staende" });
  }

  const pathNodes = getNodePath(state.structureNodes ?? [], part.structureNodeId);
  const contextHint = moduleContextHint(part.moduleKind);

  return (
    <div>
      <PageHeader
        eyebrow={`Teilenummer ${part.partNumber}${part.isVirtual ? " · virtuell" : ""}`}
        title={part.name}
        description={`${project?.customer ?? ""} · Programm ${project?.code ?? "—"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {part.isVirtual ? <StatusPill tone="watch">Virtuell</StatusPill> : null}
            {selected &&
            (selected.status === "in_entwicklung" || selected.status === "zur_pruefung") ? (
              <Button disabled={!canRelease} onClick={tryRelease}>
                Freigabe Stand {selected.revision}
              </Button>
            ) : (
              <CreatePartOrderForm part={part} />
            )}
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">
                Mehr
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-56 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-2 shadow-[var(--shadow-md)]">
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--bg-elevated)]"
                  onClick={() => setShowLoop(true)}
                >
                  Neue Entwicklungsschleife
                </button>
                {selected &&
                (selected.status === "in_entwicklung" ||
                  selected.status === "zur_pruefung") ? (
                  <div className="px-3 py-2">
                    <CreatePartOrderForm part={part} />
                  </div>
                ) : null}
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                  onClick={() => setConfirmDelete(true)}
                >
                  Bauteil löschen
                </button>
              </div>
            </details>
          </div>
        }
      />

      <nav
        aria-label="Standort im Programm"
        className="mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-[var(--ink-muted)]"
      >
        <Link
          href={projectPath(part.projectId)}
          className="font-medium text-[var(--accent)] hover:underline"
        >
          {project?.code ?? "Programm"}
        </Link>
        {pathNodes.map((n) => (
          <span key={n.id} className="inline-flex items-center gap-1.5">
            <span className="text-[var(--ink-subtle)]" aria-hidden>
              /
            </span>
            <span>{n.label}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[var(--ink-subtle)]" aria-hidden>
            /
          </span>
          <span className="font-semibold text-[var(--ink)]">{part.partNumber}</span>
          {part.side ? (
            <span className="text-[var(--ink-subtle)]">({sideLabel[part.side]})</span>
          ) : null}
        </span>
      </nav>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">{contextHint}</p>

      {confirmDelete ? (
        <div className="mb-5 rounded-[var(--radius)] border border-[var(--danger)]/35 bg-[var(--danger-soft)] px-4 py-4">
          <p className="text-sm font-medium text-[var(--danger)]">
            Bauteil {part.partNumber} wirklich vollständig löschen?
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Alle Stände, Zeichnungsreferenzen und Verknüpfungen (Profile, Spiegel) zu diesem
            Bauteil werden entfernt. Das lässt sich im Prototyp nicht rückgängig machen.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="danger"
              onClick={() => {
                const projectId = part.projectId;
                deletePart(part.id);
                navigateToProject(projectId);
              }}
            >
              Endgültig löschen
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusPill tone="accent">Stand {part.currentRevision}</StatusPill>
        {part.releasedRevision ? (
          <StatusPill tone="ok">Freigabe {part.releasedRevision}</StatusPill>
        ) : null}
        {part.moduleKind ? (
          <StatusPill>{moduleKindLabel[part.moduleKind]}</StatusPill>
        ) : null}
      </div>

      {!canRelease &&
      selected &&
      (selected.status === "in_entwicklung" || selected.status === "zur_pruefung") ? (
        <div className="mb-5 rounded-[var(--radius)] border border-[var(--warn)]/35 bg-[var(--warn-soft)] px-4 py-3 text-sm text-[var(--warn)]">
          Freigabe blockiert – {blockingOrders.length === 1
            ? "noch 1 offener Auftrag"
            : `noch ${blockingOrders.length} offene Aufträge`}{" "}
          (inkl. Unteraufträge an Profilen). Erst erledigen, dann freigeben.
        </div>
      ) : null}

      <nav
        className="mb-6 flex gap-0 overflow-x-auto border-b border-[var(--line)]"
        aria-label="Bauteil-Bereiche"
      >
        {availableTabs.map((t) => {
          const active = activeTab === t.id;
          const badge =
            t.id === "auftraege" && openCount > 0
              ? openCount
              : t.id === "unterteile" && childParts.length > 0
                ? childParts.length
                : t.id === "staende" && revisions.length > 0
                  ? revisions.length
                  : null;
          return (
            <Link
              key={t.id}
              href={tabHref(t.id)}
              className={`relative shrink-0 px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              {t.label}
              {badge != null ? (
                <span
                  className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 text-[11px] tabular-nums ${
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--ink-subtle)]"
                  }`}
                >
                  {badge}
                </span>
              ) : null}
              {active ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--accent)]" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {showLoop ? (
        <div className="mb-6">
          <DevelopmentLoopForm
            part={part}
            onDone={(rev) => {
              setShowLoop(false);
              navigateToPart(part.id, { stand: rev, tab: "staende" });
            }}
            onCancel={() => setShowLoop(false)}
          />
        </div>
      ) : null}

      {activeTab === "auftraege" ? (
        <div className="mb-6 space-y-5">
          {(() => {
            const next = partTasks.find((t) => !isDoneStatus(t.status));
            if (!next) return null;
            return (
              <NextAction
                title="Als Nächstes"
                description={next.title}
                primaryLabel="Auftrag öffnen"
                primaryHref={taskPath(next.id)}
                secondary={
                  <span className="text-sm text-[var(--ink-muted)]">
                    {taskStatusLabel[next.status] ?? next.status}
                    {next.assigneeId
                      ? ` · ${getUser(next.assigneeId)?.name ?? ""}`
                      : " · Zuweisung offen"}
                  </span>
                }
              />
            );
          })()}
          <Panel
            title={
              partTasks.length === 0
                ? "Aufträge"
                : `${openCount} offen${partTasks.length > openCount ? ` · ${partTasks.length - openCount} erledigt` : ""}`
            }
            action={<CreatePartOrderForm part={part} />}
          >
            {partTasks.length === 0 ? (
              <p className="text-sm text-[var(--ink-subtle)]">
                Noch keine Aufträge zu diesem Bauteil.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-[var(--line)]">
                  {partTasks
                    .filter((t) => !isDoneStatus(t.status))
                    .map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={taskPath(t.id)}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateToTask(t.id);
                            }}
                            className="font-medium hover:text-[var(--accent)]"
                          >
                            {t.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                            {taskTypeLabel[t.type] ?? t.type}
                            {t.revisionStand ? ` · Stand ${t.revisionStand}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <StatusPill
                            tone={statusTone(
                              t.status,
                              t.needsAssignment,
                              t.assigneeId,
                            )}
                          >
                            {t.needsAssignment || !t.assigneeId
                              ? "Zuweisung offen"
                              : (taskStatusLabel[t.status] ?? t.status)}
                          </StatusPill>
                          {t.assigneeId && !t.needsAssignment ? (
                            <StatusPill tone="neutral">
                              {getUser(t.assigneeId)?.name ?? "—"}
                            </StatusPill>
                          ) : null}
                        </div>
                      </li>
                    ))}
                </ul>
                {partTasks.some((t) => isDoneStatus(t.status)) ? (
                  <details className="mt-3 border-t border-[var(--line)] pt-3">
                    <summary className="cursor-pointer text-sm text-[var(--ink-muted)]">
                      Erledigte Aufträge (
                      {partTasks.filter((t) => isDoneStatus(t.status)).length})
                    </summary>
                    <ul className="mt-2 divide-y divide-[var(--line)]">
                      {partTasks
                        .filter((t) => isDoneStatus(t.status))
                        .map((t) => (
                          <li key={t.id} className="py-2 text-sm">
                            <Link
                              href={taskPath(t.id)}
                              className="text-[var(--ink-muted)] hover:text-[var(--accent)]"
                            >
                              {t.title}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </details>
                ) : null}
              </>
            )}
          </Panel>
        </div>
      ) : null}

      {activeTab === "uebersicht" ? (
      <>
      <PartHauptbild
        part={part}
        onChange={(imageUrl) => updatePart(part.id, { imageUrl })}
      />

      {(part.partKind === "profil" || part.partKind === "befestigung") &&
      parentAssemblies.length > 0 ? (
        <>
          {part.componentRole ? (
            <p className="mb-3 text-sm text-[var(--ink-muted)]">{part.componentRole}</p>
          ) : null}
          <SharedImpactBanner part={part} />
          <ProfileUsagePanel part={part} />
        </>
      ) : (
        <>
          {parentAssemblies.length > 0 ? (
            <div className="mb-4 rounded-[var(--radius)] border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
              <strong>
                {shared ? "Komponente von mehreren Bezügen" : "Komponente von Bezug"}
              </strong>
              <ul className="mt-1.5 space-y-1">
                {parentAssemblies.map((p) =>
                  p ? (
                    <li key={p.id}>
                      <Link href={partPath(p.id)} className="font-semibold underline">
                        {p.partNumber}
                      </Link>{" "}
                      ({p.name})
                    </li>
                  ) : null,
                )}
              </ul>
              {part.componentRole ? (
                <p className="mt-2 text-[var(--ink-muted)]">{part.componentRole}</p>
              ) : null}
            </div>
          ) : null}
          {part.componentRole && parentAssemblies.length === 0 ? (
            <p className="mb-3 text-sm text-[var(--ink-muted)]">{part.componentRole}</p>
          ) : null}
        </>
      )}

      <p className="mb-3 text-sm text-[var(--ink-muted)]">
        Ing. {engineer?.name ?? "—"} · Bezug {coverDev?.name ?? "—"}
      </p>

      <div className="mb-5 flex max-w-md flex-wrap items-end gap-3">
        <div className="min-w-[11rem] flex-1">
          <Field label="Fertigstellung">
            <input
              type="date"
              className={inputClass}
              value={part.dueDate ?? ""}
              onChange={(e) =>
                updatePart(part.id, {
                  dueDate: e.target.value.trim() || undefined,
                })
              }
            />
          </Field>
        </div>
        {part.dueDate ? (
          <StatusPill
            tone={part.dueDate < CALENDAR_TODAY ? "warn" : "accent"}
          >
            {part.dueDate < CALENDAR_TODAY
              ? `Überfällig · ${formatDate(part.dueDate)}`
              : formatDate(part.dueDate)}
          </StatusPill>
        ) : (
          <p className="pb-2 text-xs text-[var(--ink-subtle)]">
            Datum setzen – erscheint im Kalender
          </p>
        )}
      </div>

      {(part.partKind === "profil" || part.partKind === "befestigung") &&
      parentAssemblies.length > 0 ? (
        <div className="mb-5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Für dieses Profil typischerweise{" "}
          <strong className="text-[var(--ink)]">CAD-Zeichnung</strong> beauftragen. Stände des
          Profils sind unabhängig vom Bezug – eine Bezug-Änderung erzwingt kein neues Profil.
        </div>
      ) : null}

      {role === "spiegel" && mirrorMaster ? (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--watch)]/30 bg-[var(--watch-soft)] px-4 py-3 text-sm text-[var(--watch)]">
          Spiegelteil – Entwicklung über{" "}
          <Link href={partPath(mirrorMaster.id)} className="font-semibold underline">
            {mirrorMaster.partNumber}
          </Link>
          . Stände hier für Doku und Kundenzeichnung.
        </div>
      ) : null}

      {role === "entwickelt" && mirrorPair ? (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--ok)]/25 bg-[var(--ok-soft)] px-4 py-3 text-sm text-[var(--ok)]">
          Führendes Teil – Spiegel{" "}
          <Link href={partPath(mirrorPair.id)} className="font-semibold underline">
            {mirrorPair.partNumber}
          </Link>
        </div>
      ) : null}
      </>
      ) : null}

      {activeTab === "unterteile" && allowsChildren ? (
        <div className="mb-6">
          <Panel
            title={moduleRules.childrenTabLabel}
            action={
              <AssemblyAddButton
                parent={part}
                onAdded={({ cadOrdered }) => {
                  setAddHint(
                    cadOrdered
                      ? "Unterteil angelegt. CAD-Auftrag liegt beim Zeichner – du bleibst hier."
                      : "Unterteil angelegt und verknüpft.",
                  );
                  window.setTimeout(() => setAddHint(null), 6000);
                }}
              />
            }
          >
            <p className="mb-3 text-sm text-[var(--ink-muted)]">
              {moduleRules.childrenHint}
            </p>
            {addHint ? (
              <p className="mb-3 rounded-lg border border-[var(--ok)]/30 bg-[var(--ok-soft)] px-3 py-2 text-sm text-[var(--ok)]">
                {addHint}
              </p>
            ) : null}
            {childParts.length === 0 ? (
              <p className="text-sm text-[var(--ink-subtle)]">
                Noch keine Einträge – über „+ {moduleRules.childrenTabLabel}“ anlegen.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {childParts.map((c) => {
                  const cShared = isSharedComponent(c);
                  const cadOpen = hasOpenCadOrder(state.tasks, c.id);
                  return (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <PartImageThumb part={c} size="sm" />
                        <div>
                          <Link
                            href={partPath(c.id)}
                            className="font-medium hover:text-[var(--accent)]"
                          >
                            <span className="font-mono text-[var(--accent)]">
                              {c.partNumber}
                            </span>
                            {" · "}
                            {c.name}
                          </Link>
                          <p className="text-xs text-[var(--ink-muted)]">
                            {c.componentRole ??
                              partKindLabel[c.partKind ?? "profil"]}{" "}
                            · Stand {c.currentRevision}
                            {c.releasedRevision
                              ? ` · Freigabe ${c.releasedRevision}`
                              : ""}
                            {cShared
                              ? ` · geteilt (${getUsedOnPartIds(c).length} Bezüge)`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cadOpen ? <CadOrderedPill /> : null}
                        {cShared ? (
                          <StatusPill tone="watch">geteilt</StatusPill>
                        ) : null}
                        <Link href={partPath(c.id)}>
                          <Button variant="secondary">Öffnen</Button>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      ) : null}

      {activeTab === "lops" ? (
        <PartLopPanel part={part} className="mb-6" />
      ) : null}

      {activeTab === "staende" ? (
      <>
      <Panel title={`Stände von ${part.partNumber}`} className="mb-6">
        <p className="mb-3 text-xs text-[var(--ink-subtle)]">
          Jeder Stand ist fest – Zeichnungen, Fotos und Stückliste gehören zum jeweiligen Stand.
        </p>
        <div className="flex flex-wrap gap-2">
          {revisions.map((r) => {
            const active = r.revision === selectedStand;
            return (
              <Link
                key={r.id}
                href={standHref(r.revision)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--accent)]"
                }`}
              >
                Stand {r.revision}
                {r.revision === part.currentRevision ? " · aktiv" : ""}
                {r.revision === part.releasedRevision ? " · Freigabe" : ""}
              </Link>
            );
          })}
        </div>
      </Panel>

      {selected ? (
        <div className="w-full space-y-6">
          <Panel
              title={`Stand ${selected.revision} – ${selected.title}`}
              action={
                <StatusPill tone={revisionStatusTone(selected.status)}>
                  {revisionStatusLabel[selected.status]}
                </StatusPill>
              }
            >
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--ink-subtle)]">Datum</dt>
                  <dd className="font-medium">{formatDate(selected.date)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--ink-subtle)]">Erstellt von</dt>
                  <dd className="font-medium">
                    {getUser(selected.createdByUserId)?.name}
                    {selected.company ? ` (${selected.company})` : ""}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[var(--ink-subtle)]">Grund</dt>
                  <dd className="font-medium">{selected.reason}</dd>
                </div>
                {selected.basedOnRevision ? (
                  <div>
                    <dt className="text-[var(--ink-subtle)]">Basiert auf</dt>
                    <dd>
                      <Link
                        href={standHref(selected.basedOnRevision)}
                        className="text-[var(--accent)] hover:underline"
                      >
                        Stand {selected.basedOnRevision}
                      </Link>
                    </dd>
                  </div>
                ) : null}
                {selected.relaunchedAt ? (
                  <div>
                    <dt className="text-[var(--ink-subtle)]">Freigabe / Relaunch</dt>
                    <dd>
                      {formatDateTime(selected.relaunchedAt)}
                      {selected.relaunchedByUserId
                        ? ` · ${getUser(selected.relaunchedByUserId)?.name}`
                        : ""}
                    </dd>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <dt className="mb-1 text-[var(--ink-subtle)]">Gewicht (dieser Stand)</dt>
                  <dd className="flex flex-wrap items-end gap-2">
                    <div className="w-36">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className={inputClass}
                        value={selected.weightGrams ?? ""}
                        placeholder="Gramm"
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            updateRevision(selected.id, { weightGrams: undefined });
                            return;
                          }
                          const n = Number(raw);
                          if (!Number.isNaN(n) && n >= 0) {
                            updateRevision(selected.id, { weightGrams: n });
                          }
                        }}
                      />
                    </div>
                    <span className="pb-2 text-sm text-[var(--ink-muted)]">
                      g · {formatWeightGrams(selected.weightGrams)}
                    </span>
                  </dd>
                  <p className="mt-1 text-xs text-[var(--ink-subtle)]">
                    Pflichtangabe je Stand – der Verlauf zeigt die Gewichtsänderung über die
                    Entwicklung.
                  </p>
                </div>
              </dl>
            </Panel>

            <Panel title="Gewichtsverlauf">
              {revisions.every((r) => r.weightGrams == null) ? (
                <p className="text-sm text-[var(--ink-subtle)]">
                  Noch keine Gewichte hinterlegt. Bitte am jeweiligen Stand eintragen.
                </p>
              ) : (
                <>
                  <div className="mb-4 flex h-28 items-end gap-1.5">
                    {revisions.map((r) => {
                      const maxW = Math.max(
                        ...revisions.map((x) => x.weightGrams ?? 0),
                        1,
                      );
                      const hPx =
                        r.weightGrams != null
                          ? Math.max(8, Math.round((r.weightGrams / maxW) * 96))
                          : 4;
                      const active = r.revision === selectedStand;
                      return (
                        <Link
                          key={r.id}
                          href={standHref(r.revision)}
                          className="flex min-w-0 flex-1 flex-col items-center gap-1"
                          title={
                            r.weightGrams != null
                              ? `Stand ${r.revision}: ${formatWeightGrams(r.weightGrams)}`
                              : `Stand ${r.revision}: kein Gewicht`
                          }
                        >
                          <span className="text-[10px] tabular-nums text-[var(--ink-subtle)]">
                            {r.weightGrams != null
                              ? formatWeightGrams(r.weightGrams)
                              : "—"}
                          </span>
                          <div
                            className={`w-full max-w-[40px] rounded-t-md ${
                              active ? "bg-[var(--accent)]" : "bg-[var(--accent-soft)]"
                            }`}
                            style={{ height: hPx }}
                          />
                          <span className="text-[11px] font-medium text-[var(--ink-muted)]">
                            {r.revision}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  <ul className="divide-y divide-[var(--line)] text-sm">
                    {revisions.map((r, i) => {
                      const prev = i > 0 ? revisions[i - 1] : undefined;
                      const delta =
                        r.weightGrams != null && prev?.weightGrams != null
                          ? r.weightGrams - prev.weightGrams
                          : null;
                      return (
                        <li
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2"
                        >
                          <Link
                            href={standHref(r.revision)}
                            className="font-medium hover:text-[var(--accent)]"
                          >
                            Stand {r.revision}
                          </Link>
                          <span className="tabular-nums text-[var(--ink)]">
                            {formatWeightGrams(r.weightGrams)}
                            {delta != null && delta !== 0 ? (
                              <span
                                className={
                                  delta > 0
                                    ? "ml-2 text-[var(--warn)]"
                                    : "ml-2 text-[var(--ok)]"
                                }
                              >
                                {delta > 0 ? "+" : ""}
                                {formatWeightGrams(Math.abs(delta))}
                                {delta > 0 ? " schwerer" : " leichter"}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </Panel>

            <Panel title={isBezugAssembly ? "Stückliste / Zuschnitt" : "Stückliste (dieser Stand)"}>
              {isBezugAssembly ? (
                <BezugCutBomPanel
                  revision={selected}
                  onChange={(patch) => updateRevision(selected.id, patch)}
                />
              ) : selected.bomItems.length === 0 ? (
                <p className="text-sm text-[var(--ink-subtle)]">Keine Positionen hinterlegt.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {selected.bomItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2"
                    >
                      <span className="text-[var(--ink-subtle)]">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {selected.componentStands && selected.componentStands.length > 0 ? (
              <Panel title="Profile an diesem Bezug-Stand">
                <p className="mb-3 text-xs text-[var(--ink-subtle)]">
                  Welcher Profil-Stand genau hier hängt – unabhängig davon, ob der Bezug neu ist.
                  „1:1 übernommen“ = kein neues CAD fürs Profil.
                </p>
                <ul className="space-y-2">
                  {selected.componentStands.map((cs) => {
                    const child = state.parts.find((p) => p.id === cs.partId);
                    return (
                      <li
                        key={cs.partId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm"
                      >
                        <div>
                          {child ? (
                            <Link
                              href={partPath(child.id, { stand: cs.revision })}
                              className="font-mono text-[var(--accent)] hover:underline"
                            >
                              {child.partNumber}
                            </Link>
                          ) : (
                            cs.partId
                          )}
                          <span className="text-[var(--ink-muted)]">
                            {" "}
                            · Profil-Stand {cs.revision}
                          </span>
                        </div>
                        <StatusPill tone={cs.carriedOver ? "ok" : "accent"}>
                          {cs.carriedOver ? "1:1 übernommen" : "mit geändert"}
                        </StatusPill>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ) : null}

            <Panel title="CAD-Zeichnung (dieser Stand)">
              <DxfViewerPanel
                part={part}
                dxf={selected.dxf}
                onChange={(dxf) => updateRevision(selected.id, { dxf })}
              />
              {(selected.drawings.length > 0 || selected.files.length > 0) && (
                <div className="mt-4 border-t border-[var(--line)] pt-3">
                  <p className="mb-2 text-xs text-[var(--ink-subtle)]">Weitere Dateireferenzen</p>
                  <div className="space-y-2">
                    {(selected.drawings.length ? selected.drawings : selected.files).map((f) => (
                      <div
                        key={f}
                        className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Dokumente">
              <div className="space-y-2">
                {selected.documents.length === 0 ? (
                  <p className="text-sm text-[var(--ink-subtle)]">Keine Dokumente.</p>
                ) : (
                  selected.documents.map((d) => (
                    <div
                      key={d}
                      className="rounded-lg border border-dashed border-[var(--line)] px-3 py-2 text-sm text-[var(--ink-muted)]"
                    >
                      {d}
                    </div>
                  ))
                )}
              </div>
            </Panel>

            <Panel title="Fotos">
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {selected.photos.length === 0 ? (
                  <p className="col-span-full text-sm text-[var(--ink-subtle)]">Keine Fotos.</p>
                ) : (
                  selected.photos.map((ph) => (
                    <div
                      key={ph}
                      className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-[var(--line-strong)] bg-[linear-gradient(145deg,#e8eef2,#f7f5f2)] p-2 text-center text-xs text-[var(--ink-subtle)]"
                    >
                      {ph}
                    </div>
                  ))
                )}
              </div>
            </Panel>
        </div>
      ) : (
        <Panel>
          <p className="text-sm text-[var(--ink-subtle)]">
            Noch keine Stände. Starte eine Entwicklungsschleife.
          </p>
        </Panel>
      )}

      <Panel title="Timeline aller Stände" className="mt-6">
        <ol className="relative ml-2 border-l border-[var(--line-strong)]">
          {revisions.map((r) => (
            <li key={r.id} className="relative pb-6 pl-6 last:pb-0">
              <span
                className={`absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-2 ${
                  r.revision === selectedStand
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-[var(--line-strong)] bg-[var(--surface)]"
                }`}
              />
              <Link href={standHref(r.revision)} className="group">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold group-hover:text-[var(--accent)]">
                    Stand {r.revision}
                  </span>
                  <StatusPill tone={revisionStatusTone(r.status)}>
                    {revisionStatusLabel[r.status]}
                  </StatusPill>
                </div>
                <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                  {r.title} · {formatDate(r.date)}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </Panel>
      </>
      ) : null}
    </div>
  );
}

