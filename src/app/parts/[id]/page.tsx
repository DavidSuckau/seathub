"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AssemblyAddButton } from "@/components/AssemblyAddButton";
import { CreatePartOrderForm } from "@/components/CreatePartOrderForm";
import { DevelopmentLoopForm } from "@/components/DevelopmentLoopForm";
import {
  ProfileUsagePanel,
  SharedImpactBanner,
} from "@/components/LinkExistingProfileForm";
import { PartLopPanel } from "@/components/PartLopPanel";
import { PartHauptbild, PartImageThumb } from "@/components/PartHauptbild";
import { Button, PageHeader, Panel, StatusPill, inputClass } from "@/components/ui";
import { navigate, taskPath, navigateToTask } from "@/lib/nav";
import {
  getChildComponents,
  getUsedOnPartIds,
  isAssemblyPart,
  isSharedComponent,
} from "@/lib/components";
import { formatDate, formatDateTime, taskTypeLabel } from "@/lib/labels";
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
  moduleKindLabel,
  partPathLabel,
  sideLabel,
} from "@/lib/structure";

function PartDetailInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { state, relaunchStand, updateRevision, deletePart, updatePart, getProject, getUser } =
    useStore();
  const part = state.parts.find((p) => p.id === params.id);
  const [showLoop, setShowLoop] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const revisions = part ? getPartRevisions(state.revisions, part.id) : [];
  const standParam = searchParams.get("stand");
  const selectedStand =
    standParam && revisions.some((r) => r.revision === standParam)
      ? standParam
      : (part?.currentRevision ?? revisions[revisions.length - 1]?.revision);
  const selected = revisions.find((r) => r.revision === selectedStand);

  if (!part) {
    return (
      <div>
        <PageHeader title="Bauteil nicht gefunden" />
        <Link href="/projects">Zu Projekten</Link>
      </div>
    );
  }

  const project = getProject(part.projectId);
  const pathLabel = partPathLabel(state.structureNodes ?? [], part);
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
  const isAssembly = isAssemblyPart(part);
  const shared = isSharedComponent(part);

  return (
    <div>
      <PageHeader
        eyebrow={`Teilenummer ${part.partNumber}${part.isVirtual ? " · virtuell" : ""}`}
        title={part.name}
        description={`${project?.customer ?? ""} · Programm ${project?.code ?? "—"}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {part.isVirtual ? <StatusPill tone="watch">Virtueller Bezug</StatusPill> : null}
            <Button variant="secondary" onClick={() => setShowLoop((v) => !v)}>
              Neue Entwicklungsschleife
            </Button>
            {selected &&
            (selected.status === "in_entwicklung" || selected.status === "zur_pruefung") ? (
              <Button onClick={() => relaunchStand(part.id, selected.id)}>
                Freigabe / Relaunch Stand {selected.revision}
              </Button>
            ) : null}
            <Button
              variant="danger"
              onClick={() => setConfirmDelete(true)}
            >
              Bauteil löschen
            </Button>
          </div>
        }
      />

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
                navigate(`/projects/${projectId}`);
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
        <StatusPill tone="accent">Aktuell Stand {part.currentRevision}</StatusPill>
        {part.releasedRevision ? (
          <StatusPill tone="ok">Freigabe Stand {part.releasedRevision}</StatusPill>
        ) : null}
        {part.partKind ? (
          <StatusPill tone="accent">{partKindLabel[part.partKind]}</StatusPill>
        ) : null}
        {part.moduleKind ? <StatusPill>{moduleKindLabel[part.moduleKind]}</StatusPill> : null}
        {part.side ? <StatusPill>{sideLabel[part.side]}</StatusPill> : null}
        <StatusPill tone={role === "spiegel" ? "watch" : "neutral"}>
          {developmentRoleLabel[role]}
        </StatusPill>
        <Link
          href={`/projects/${part.projectId}`}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Zum Programm
        </Link>
      </div>

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
                      <Link href={`/parts/${p.id}`} className="font-semibold underline">
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

      <p className="mb-2 text-sm text-[var(--ink-muted)]">{pathLabel}</p>
      <p className="mb-5 text-sm text-[var(--ink-muted)]">
        Ing. {engineer?.name ?? "—"} · Bezug {coverDev?.name ?? "—"}
      </p>

      {isAssembly ? (
        <div className="mb-6">
          <Panel
            title="Profile & Komponenten am Bezug"
            action={<AssemblyAddButton parent={part} />}
          >
            <p className="mb-3 text-sm text-[var(--ink-muted)]">
              Profile haben eigene Teilenummern und eigene Stände. Ein Profil kann an mehreren
              Bezügen hängen (geteilt). Am Bezug-Stand siehst du, welcher Profil-Stand verwendet
              wird – oft 1:1 übernommen ohne neues CAD.
            </p>
            {childParts.length === 0 ? (
              <p className="text-sm text-[var(--ink-subtle)]">Noch keine Profile hinterlegt.</p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {childParts.map((c) => {
                  const cShared = isSharedComponent(c);
                  return (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <PartImageThumb part={c} size="sm" />
                        <div>
                        <Link
                          href={`/parts/${c.id}`}
                          className="font-medium hover:text-[var(--accent)]"
                        >
                          <span className="font-mono text-[var(--accent)]">{c.partNumber}</span>
                          {" · "}
                          {c.name}
                        </Link>
                        <p className="text-xs text-[var(--ink-muted)]">
                          {c.componentRole ?? partKindLabel[c.partKind ?? "profil"]} · Stand{" "}
                          {c.currentRevision}
                          {c.releasedRevision ? ` · Freigabe ${c.releasedRevision}` : ""}
                          {cShared
                            ? ` · geteilt (${getUsedOnPartIds(c).length} Bezüge)`
                            : ""}
                        </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cShared ? <StatusPill tone="watch">geteilt</StatusPill> : null}
                        <StatusPill tone="accent">
                          {partKindLabel[c.partKind ?? "profil"]}
                        </StatusPill>
                        <Link href={`/parts/${c.id}`}>
                          <Button variant="secondary">Öffnen · Verwendung</Button>
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

      {(part.partKind === "profil" || part.partKind === "befestigung") &&
      parentAssemblies.length > 0 ? (
        <div className="mb-5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Für dieses Profil typischerweise{" "}
          <strong className="text-[var(--ink)]">CAD-Zeichnung</strong> beauftragen. Stände des
          Profils sind unabhängig vom Bezug – eine Bezug-Änderung erzwingt kein neues Profil.
        </div>
      ) : null}

      <div className="mb-5">
        <CreatePartOrderForm
          part={part}
          onCreated={(t) => {
            navigateToTask(t.id);
          }}
        />
      </div>

      <PartLopPanel part={part} className="mb-6" />

      {role === "spiegel" && mirrorMaster ? (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--watch)]/30 bg-[var(--watch-soft)] px-4 py-3 text-sm text-[var(--watch)]">
          Spiegelteil – Entwicklung über{" "}
          <Link href={`/parts/${mirrorMaster.id}`} className="font-semibold underline">
            {mirrorMaster.partNumber}
          </Link>
          . Stände hier für Doku und Kundenzeichnung.
        </div>
      ) : null}

      {role === "entwickelt" && mirrorPair ? (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--ok)]/25 bg-[var(--ok-soft)] px-4 py-3 text-sm text-[var(--ok)]">
          Führendes Teil – Spiegel{" "}
          <Link href={`/parts/${mirrorPair.id}`} className="font-semibold underline">
            {mirrorPair.partNumber}
          </Link>
        </div>
      ) : null}

      {showLoop ? (
        <DevelopmentLoopForm
          part={part}
          onDone={(rev) => {
            setShowLoop(false);
            navigate(`/parts/${part.id}?stand=${rev}`);
          }}
          onCancel={() => setShowLoop(false)}
        />
      ) : null}

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
                href={`/parts/${part.id}?stand=${r.revision}`}
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
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-6">
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
                        href={`/parts/${part.id}?stand=${selected.basedOnRevision}`}
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
                          href={`/parts/${part.id}?stand=${r.revision}`}
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
                            href={`/parts/${part.id}?stand=${r.revision}`}
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

            <Panel title="Stückliste (dieser Stand)">
              {selected.bomItems.length === 0 ? (
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
                              href={`/parts/${child.id}?stand=${cs.revision}`}
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
          </div>

          <div className="space-y-6">
            <Panel title="Zeichnungen (dieser Stand)">
              <div className="space-y-2">
                {(selected.drawings.length ? selected.drawings : selected.files).map((f) => (
                  <div
                    key={f}
                    className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm font-medium"
                  >
                    {f}
                  </div>
                ))}
                {selected.drawings.length === 0 && selected.files.length === 0 ? (
                  <p className="text-sm text-[var(--ink-subtle)]">Keine Zeichnungen.</p>
                ) : null}
              </div>
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
              <div className="grid grid-cols-2 gap-2">
                {selected.photos.length === 0 ? (
                  <p className="col-span-2 text-sm text-[var(--ink-subtle)]">Keine Fotos.</p>
                ) : (
                  selected.photos.map((ph) => (
                    <div
                      key={ph}
                      className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-[var(--line-strong)] bg-[linear-gradient(145deg,#e8eef2,#f7f5f2)] p-2 text-center text-xs text-[var(--ink-subtle)]"
                    >
                      {ph}
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>
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
              <Link href={`/parts/${part.id}?stand=${r.revision}`} className="group">
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

      <Panel title="Aufträge zu diesem Bauteil" className="mt-6">
        <ul className="space-y-2 text-sm">
          {state.tasks.filter((t) => t.partId === part.id).length === 0 ? (
            <li className="text-[var(--ink-subtle)]">
              Noch keine Aufträge – über „Auftrag zum Bauteil“ einstellen.
            </li>
          ) : (
            state.tasks
              .filter((t) => t.partId === part.id)
              .map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] py-2">
                  <Link href={taskPath(t.id)} className="font-medium hover:text-[var(--accent)]">
                    {t.title}
                  </Link>
                  <div className="flex gap-1.5">
                    <StatusPill>{taskTypeLabel[t.type] ?? t.type}</StatusPill>
                    {t.needsAssignment || !t.assigneeId ? (
                      <StatusPill tone="warn">Zuweisung offen</StatusPill>
                    ) : (
                      <StatusPill tone="ok">{getUser(t.assigneeId)?.name}</StatusPill>
                    )}
                  </div>
                </li>
              ))
          )}
        </ul>
      </Panel>
    </div>
  );
}

export default function PartDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-[var(--ink-muted)]">Bauteil wird geladen…</div>
      }
    >
      <PartDetailInner />
    </Suspense>
  );
}
