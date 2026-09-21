"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Field, Panel, StatusPill, inputClass } from "@/components/ui";
import { getUsedOnPartIds, isSharedComponent } from "@/lib/components";
import { partKindLabel } from "@/lib/orders";
import { moduleKindLabel, sideLabel } from "@/lib/structure";
import { useStore } from "@/lib/store";
import type { Part } from "@/lib/types";

/** Bestehendes Profil an diesen Bezug knüpfen (geteilte Verwendung) */
export function LinkExistingProfileForm({ assembly }: { assembly: Part }) {
  const { state, linkComponentToAssembly } = useStore();
  const [open, setOpen] = useState(false);
  const [componentId, setComponentId] = useState("");

  const candidates = useMemo(() => {
    return state.parts.filter((p) => {
      if (p.projectId !== assembly.projectId) return false;
      if (p.partKind !== "profil" && p.partKind !== "befestigung") return false;
      return !getUsedOnPartIds(p).includes(assembly.id);
    });
  }, [state.parts, assembly]);

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Bestehendes Profil verknüpfen
      </Button>
    );
  }

  return (
    <Panel title="Bestehendes Profil an diesen Bezug" className="mb-3">
      <p className="mb-3 text-sm text-[var(--ink-muted)]">
        Gleiches Profil für mehrere Bezüge (z. B. Alcantara, Leder, Stoff). Eine Änderung am
        Profil gilt dann für alle verknüpften Bezüge.
      </p>
      <Field label="Profil">
        <select
          className={inputClass}
          value={componentId}
          onChange={(e) => setComponentId(e.target.value)}
        >
          <option value="">— wählen —</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.partNumber} · {c.name} (Stand {c.currentRevision})
            </option>
          ))}
        </select>
      </Field>
      <div className="mt-3 flex gap-2">
        <Button
          onClick={() => {
            if (!componentId) return;
            linkComponentToAssembly(componentId, assembly.id);
            setOpen(false);
            setComponentId("");
          }}
        >
          Verknüpfen
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Abbrechen
        </Button>
      </div>
      {candidates.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--ink-subtle)]">
          Keine weiteren Profile im Programm verfügbar.
        </p>
      ) : null}
    </Panel>
  );
}

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
        shared ? <StatusPill tone="watch">{usedOn.length} Bezüge · geteilt</StatusPill> : (
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
              href={`/parts/${a.id}`}
              className="flex flex-wrap items-center justify-between gap-2 py-3 transition hover:bg-[var(--bg)]/80"
            >
              <div>
                <span className="font-mono font-medium text-[var(--accent)]">{a.partNumber}</span>
                <span className="text-[var(--ink-subtle)]"> · </span>
                <span className="font-medium text-[var(--ink)]">{a.name}</span>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  {a.moduleKind ? moduleKindLabel[a.moduleKind] : partKindLabel[a.partKind ?? "hauptteil"]}
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

/** Kurz-Hinweis nur wenn geteilt (Zusatz zur Usage-Panel) */
export function SharedImpactBanner({ part }: { part: Part }) {
  if (!isSharedComponent(part)) return null;
  return (
    <div className="mb-4 rounded-[var(--radius)] border border-[var(--watch)]/35 bg-[var(--watch-soft)] px-4 py-3 text-sm text-[var(--watch)]">
      <strong>Achtung:</strong> Geteiltes Profil – CAD- oder Stand-Änderungen wirken auf alle
      verknüpften Bezüge (siehe Liste unten).
    </div>
  );
}
