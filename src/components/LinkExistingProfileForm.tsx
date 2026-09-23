"use client";

import Link from "next/link";
import { Panel, StatusPill } from "@/components/ui";
import { getUsedOnPartIds, isSharedComponent } from "@/lib/components";
import { partKindLabel } from "@/lib/orders";
import { moduleKindLabel, sideLabel } from "@/lib/structure";
import { useStore } from "@/lib/store";
import type { Part } from "@/lib/types";
import { partPath } from "@/lib/nav";

/**
 * Auf jedem Profil: klickbare Liste aller Bezüge/Bauteile, die dieses Profil verwenden.
 */
export function ProfileUsagePanel({ part }: { part: Part }) {
  const { state } = useStore();
  const usedOn = getUsedOnPartIds(part)
    .map((id) => state.parts.find((p) => p.id === id))
    .filter((p): p is Part => Boolean(p));

  if (usedOn.length === 0) return null;

  const shared = isSharedComponent(part);

  return (
    <Panel
      title="Verwendet von diesen Bauteilen"
      className="mb-6"
      action={
        shared ? (
          <StatusPill tone="watch">{usedOn.length} Bezüge · geteilt</StatusPill>
        ) : (
          <StatusPill tone="accent">{usedOn.length} Bezug</StatusPill>
        )
      }
    >
      <p className="mb-3 text-sm text-[var(--ink-muted)]">
        {shared
          ? "Geteiltes Profil – eine Änderung gilt für alle verknüpften Bezüge. Zum Bauteil klicken."
          : "Dieses Profil hängt an folgendem Bezug. Zum Bauteil klicken."}
      </p>
      <ul className="divide-y divide-[var(--line)]">
        {usedOn.map((a) => (
          <li key={a.id}>
            <Link
              href={partPath(a.id)}
              className="flex flex-wrap items-center justify-between gap-2 py-3 transition hover:bg-[var(--bg)]/80"
            >
              <div>
                <span className="font-mono font-medium text-[var(--accent)]">
                  {a.partNumber}
                </span>
                <span className="text-[var(--ink-subtle)]"> · </span>
                <span className="font-medium text-[var(--ink)]">{a.name}</span>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  {a.moduleKind
                    ? moduleKindLabel[a.moduleKind]
                    : partKindLabel[a.partKind ?? "hauptteil"]}
                  {a.side ? ` · ${sideLabel[a.side]}` : ""}
                  {` · Stand ${a.currentRevision}`}
                </p>
              </div>
              <span className="text-sm text-[var(--accent)]">Öffnen →</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Kurz-Hinweis nur wenn geteilt */
export function SharedImpactBanner({ part }: { part: Part }) {
  if (!isSharedComponent(part)) return null;
  return (
    <div className="mb-4 rounded-[var(--radius)] border border-[var(--watch)]/35 bg-[var(--watch-soft)] px-4 py-3 text-sm text-[var(--watch)]">
      <strong>Achtung:</strong> Geteiltes Profil – CAD- oder Stand-Änderungen wirken auf alle
      verknüpften Bezüge (siehe Liste unten).
    </div>
  );
}

/** @deprecated – Verknüpfen läuft über AssemblyAddButton (+) */
export function LinkExistingProfileForm(_props: { assembly: Part }) {
  return null;
}
