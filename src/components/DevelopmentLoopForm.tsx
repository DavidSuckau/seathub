"use client";

import { useMemo, useState } from "react";
import { Button, Field, Panel, StatusPill, inputClass } from "@/components/ui";
import {
  getAssembliesUsing,
  getChildComponents,
  getUsedOnPartIds,
  isAssemblyPart,
  isSharedComponent,
} from "@/lib/components";
import { useStore } from "@/lib/store";
import type { Part } from "@/lib/types";

export function DevelopmentLoopForm({
  part,
  onDone,
  onCancel,
}: {
  part: Part;
  onDone: (revision: string) => void;
  onCancel: () => void;
}) {
  const { state, startDevelopmentLoop } = useStore();
  const [reason, setReason] = useState("");
  const children = useMemo(
    () => (isAssemblyPart(part) ? getChildComponents(state.parts, part.id) : []),
    [state.parts, part],
  );
  const [carryMap, setCarryMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(children.map((c) => [c.id, true])),
  );

  const impactAssemblies =
    part.partKind === "profil" || part.partKind === "befestigung" || isSharedComponent(part)
      ? getAssembliesUsing(state.parts, part.id)
      : [];

  function submit() {
    const created = startDevelopmentLoop(part.id, reason || "Neue Entwicklungsschleife", {
      componentDecisions: children.map((c) => ({
        partId: c.id,
        carryOver: carryMap[c.id] !== false,
      })),
    });
    if (created) onDone(created.revision);
  }

  return (
    <Panel title="Neue Entwicklungsschleife" className="mb-6">
      <p className="mb-3 text-sm text-[var(--ink-muted)]">
        Legt den nächsten Stand an. Bezug und Profile haben <strong>unabhängige</strong> Stände –
        Profile können 1:1 übernommen werden, ohne neues CAD.
      </p>

      {impactAssemblies.length > 1 ? (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--watch)]/30 bg-[var(--watch-soft)] px-3 py-2.5 text-sm text-[var(--watch)]">
          <strong>Geteiltes Profil:</strong> Änderung wirkt auf{" "}
          {impactAssemblies.map((a) => a.partNumber).join(", ")}.
        </div>
      ) : null}

      <Field label="Grund / Auftrag">
        <input
          className={inputClass}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="z. B. LOP abgearbeitet, neuer Kundenauftrag …"
        />
      </Field>

      {children.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-[var(--ink)]">
            Profile an diesem Bezug – was passiert mit dem neuen Stand?
          </p>
          <ul className="divide-y divide-[var(--line)] rounded-[var(--radius)] border border-[var(--line)]">
            {children.map((c) => {
              const shared = getUsedOnPartIds(c).length > 1;
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-mono text-[var(--accent)]">{c.partNumber}</span>
                    <span className="text-[var(--ink-subtle)]"> · </span>
                    {c.name}
                    <span className="text-[var(--ink-muted)]">
                      {" "}
                      (aktuell Stand {c.currentRevision})
                    </span>
                    {shared ? (
                      <StatusPill tone="watch">geteilt</StatusPill>
                    ) : null}
                  </div>
                  <select
                    className={`${inputClass} w-auto min-w-[220px]`}
                    value={carryMap[c.id] !== false ? "carry" : "new"}
                    onChange={(e) =>
                      setCarryMap((m) => ({
                        ...m,
                        [c.id]: e.target.value === "carry",
                      }))
                    }
                  >
                    <option value="carry">1:1 übernehmen (kein neues CAD)</option>
                    <option value="new">Neues Profil-Stand nötig</option>
                  </select>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <Button onClick={submit}>Schleife starten</Button>
        <Button variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </Panel>
  );
}
