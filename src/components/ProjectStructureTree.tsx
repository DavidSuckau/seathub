"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type ArtFilter,
  nodeMatchesArt,
  partMatchesArt,
} from "@/components/ModuleKindFilter";
import { PartImageThumb } from "@/components/PartHauptbild";
import { StatusPill } from "@/components/ui";
import { isComponentPart } from "@/lib/components";
import { formatDate } from "@/lib/labels";
import { getPartRevisions, revisionStatusLabel } from "@/lib/revisions";
import {
  countPartsUnderNode,
  developmentRoleLabel,
  getChildren,
  getNodePath,
  groupPartsForDisplay,
  moduleKindLabel,
  sideLabel,
  structureTypeLabel,
} from "@/lib/structure";
import type { Part, Revision, StructureNode } from "@/lib/types";
import { partPath } from "@/lib/nav";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      className={`shrink-0 text-[var(--ink-subtle)] transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PartRow({
  part,
  mirror,
  getUserName,
  revisions,
  standView,
}: {
  part: Part;
  mirror?: Part;
  getUserName: (id?: string) => string;
  revisions: Revision[];
  standView: "aktuell" | "alle";
}) {
  const role = part.developmentRole ?? "eigenstaendig";
  const partRevs = getPartRevisions(revisions, part.id);
  const showRevs =
    standView === "alle"
      ? partRevs
      : partRevs.filter((r) => r.revision === part.currentRevision);

  return (
    <div className="ml-3 rounded-lg border border-[var(--line)] bg-[var(--bg)]/50 sm:ml-5">
      <Link
        href={partPath(part.id, { stand: part.currentRevision })}
        className="org-node flex items-start gap-2.5 px-2.5 py-2.5 hover:bg-[var(--bg-elevated)]"
      >
        <PartImageThumb part={part} size="sm" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--ink)]">
            <span className="font-mono text-[13px] text-[var(--accent)]">{part.partNumber}</span>
            <span className="text-[var(--ink-subtle)]"> · </span>
            {part.name}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {part.side ? <StatusPill>{sideLabel[part.side]}</StatusPill> : null}
            <StatusPill tone="accent">Stand {part.currentRevision}</StatusPill>
            {part.releasedRevision ? (
              <StatusPill tone="ok">Freigabe {part.releasedRevision}</StatusPill>
            ) : null}
            {part.dueDate ? (
              <StatusPill tone="neutral">
                Fertig {formatDate(part.dueDate)}
              </StatusPill>
            ) : null}
            <StatusPill tone={role === "spiegel" ? "watch" : role === "entwickelt" ? "ok" : "neutral"}>
              {developmentRoleLabel[role]}
            </StatusPill>
          </div>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            {part.coverDeveloperUserId
              ? `Bezug ${getUserName(part.coverDeveloperUserId)}`
              : ""}
            {part.engineerUserId ? ` · Ing. ${getUserName(part.engineerUserId)}` : ""}
          </p>
        </div>
      </Link>

      {showRevs.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-[var(--line)] px-2.5 py-2">
          {showRevs.map((r) => (
            <Link
              key={r.id}
              href={partPath(part.id, { stand: r.revision })}
              className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              title={revisionStatusLabel[r.status]}
            >
              {r.revision}
              {r.status === "in_entwicklung" ? "…" : ""}
              {r.status === "relaunched" || r.status === "freigegeben" ? "✓" : ""}
            </Link>
          ))}
        </div>
      ) : null}

      {mirror ? (
        <Link
          href={partPath(mirror.id, { stand: mirror.currentRevision })}
          className="flex items-center gap-2 border-t border-dashed border-[var(--line)] px-2.5 py-2 text-xs text-[var(--ink-muted)] hover:bg-[var(--bg-elevated)]"
        >
          <span className="rounded bg-[var(--watch-soft)] px-1.5 py-0.5 font-medium text-[var(--watch)]">
            Spiegel
          </span>
          <span className="font-mono text-[var(--accent)]">{mirror.partNumber}</span>
          <span>· Stand {mirror.currentRevision}</span>
        </Link>
      ) : null}
    </div>
  );
}

function NodeBlock({
  node,
  nodes,
  parts,
  revisions,
  standView,
  depth,
  getUserName,
  defaultOpen,
  artFilter,
}: {
  node: StructureNode;
  nodes: StructureNode[];
  parts: Part[];
  revisions: Revision[];
  standView: "aktuell" | "alle";
  depth: number;
  getUserName: (id?: string) => string;
  defaultOpen?: boolean;
  artFilter: ArtFilter;
}) {
  const [open, setOpen] = useState(defaultOpen ?? depth < 2);
  const rawChildren = getChildren(nodes, node.projectId, node.id);
  const children = rawChildren.filter((c) => {
    if (artFilter === "alle") return true;
    if (c.type === "modul") return nodeMatchesArt(c, artFilter);
    const underParts = parts.filter((p) =>
      getNodePath(nodes, p.structureNodeId).some((n) => n.id === c.id),
    );
    if (underParts.length > 0) return true;
    return nodes.some(
      (n) =>
        n.type === "modul" &&
        nodeMatchesArt(n, artFilter) &&
        getNodePath(nodes, n.id).some((x) => x.id === c.id),
    );
  });
  const leafParts = parts.filter(
    (p) => p.structureNodeId === node.id && !isComponentPart(p),
  );
  const groups = groupPartsForDisplay(leafParts);
  const totalUnder = countPartsUnderNode(nodes, parts, node.id);
  const hasKids = children.length > 0 || leafParts.length > 0;

  if (artFilter !== "alle" && node.type === "modul" && !nodeMatchesArt(node, artFilter)) {
    return null;
  }
  if (artFilter !== "alle" && !hasKids && node.type !== "modul") {
    // leere Reihen/Arten ausblenden
    if (node.type === "sitzreihe" || node.type === "sitzvariante" || node.type === "bezugvariante") {
      return null;
    }
  }

  return (
    <div className={depth > 0 ? "ml-3 border-l border-[var(--line)] pl-2 sm:ml-4 sm:pl-3" : ""}>
      <button
        type="button"
        onClick={() => hasKids && setOpen((v) => !v)}
        className="org-node flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left"
      >
        {hasKids ? <Chevron open={open} /> : <span className="w-3.5" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--ink)]">{node.label}</span>
            <StatusPill tone={node.type === "modul" ? "accent" : "neutral"}>
              {node.moduleKind
                ? moduleKindLabel[node.moduleKind]
                : structureTypeLabel[node.type]}
            </StatusPill>
          </div>
        </div>
        <span className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
          {totalUnder} Bauteil{totalUnder === 1 ? "" : "e"}
        </span>
      </button>

      {open ? (
        <div className="space-y-1.5 pb-1">
          {children.map((child) => (
            <NodeBlock
              key={child.id}
              node={child}
              nodes={nodes}
              parts={parts}
              revisions={revisions}
              standView={standView}
              depth={depth + 1}
              getUserName={getUserName}
              defaultOpen={depth < 1 || artFilter !== "alle"}
              artFilter={artFilter}
            />
          ))}
          {groups.map(({ primary, mirror }) => (
            <PartRow
              key={primary.id}
              part={primary}
              mirror={mirror}
              getUserName={getUserName}
              revisions={revisions}
              standView={standView}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectStructureTree({
  projectId,
  nodes,
  parts,
  revisions,
  standView = "aktuell",
  getUserName,
  artFilter = "alle",
}: {
  projectId: string;
  nodes: StructureNode[];
  parts: Part[];
  revisions: Revision[];
  standView?: "aktuell" | "alle";
  getUserName: (id?: string) => string;
  artFilter?: ArtFilter;
}) {
  const roots = getChildren(nodes, projectId, null);
  const projectParts = parts.filter(
    (p) => p.projectId === projectId && partMatchesArt(p, artFilter),
  );

  if (roots.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-subtle)]">
        Noch keine Sitzstruktur. Mit „Struktur erweitern“ zuerst eine Sitzreihe anlegen, dann
        Sitzarten (z. B. Sportsitz) und Bezugvarianten.
      </p>
    );
  }

  const visibleRoots = roots.filter((node) => {
    if (artFilter === "alle") return true;
    // Zeige Reihe wenn darunter passende Teile oder passende Module
    const under = projectParts.filter((p) =>
      getNodePath(nodes, p.structureNodeId).some((n) => n.id === node.id),
    );
    if (under.length > 0) return true;
    const mods = nodes.filter(
      (n) =>
        n.projectId === projectId &&
        n.type === "modul" &&
        nodeMatchesArt(n, artFilter) &&
        getNodePath(nodes, n.id).some((x) => x.id === node.id),
    );
    return mods.length > 0;
  });

  return (
    <div className="space-y-1">
      <p className="mb-3 text-xs text-[var(--ink-subtle)]">
        {standView === "aktuell"
          ? "Anzeige: nur aktueller Stand je Bauteil. Umschalten für alle historischen Stände."
          : "Anzeige: alle Stände (01, 02, 03 …) – klickbar zur Detailansicht mit Zeichnungen/Fotos."}
        {artFilter !== "alle" ? " · gefiltert nach Art." : ""}
      </p>
      {visibleRoots.length === 0 ? (
        <p className="text-sm text-[var(--ink-subtle)]">
          Keine Bauteile dieser Art in der Struktur.
        </p>
      ) : (
        visibleRoots.map((node) => (
          <NodeBlock
            key={node.id}
            node={node}
            nodes={nodes}
            parts={projectParts}
            revisions={revisions}
            standView={standView}
            depth={0}
            getUserName={getUserName}
            defaultOpen
            artFilter={artFilter}
          />
        ))
      )}
    </div>
  );
}
