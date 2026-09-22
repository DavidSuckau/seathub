"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AssemblyAddButton } from "@/components/AssemblyAddButton";
import { Field, Panel, StatusPill, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Part, Task, TaskType } from "@/lib/types";

/** Nur in der Entwicklung: Profile/Komponenten anlegen */
const CAN_CREATE_COMPONENTS: TaskType[] = [
  "bezugsentwicklung",
  "entwicklungsschleife",
  "schnittentwicklung",
  "cad",
  "aenderung",
];

function canCreateComponents(type: TaskType): boolean {
  return CAN_CREATE_COMPONENTS.includes(type);
}

function isBezugLike(part: Part): boolean {
  return (
    part.moduleKind === "bezug" ||
    part.partKind === "hauptteil" ||
    (!part.parentPartId && part.moduleKind !== "profil")
  );
}

function kindPill(part: Part): string {
  if (part.partKind === "befestigung") return "Befestigung";
  if (part.partKind === "sonstig") return "Komponente";
  if (part.partKind === "profil" || part.moduleKind === "profil") return "Profil";
  return "Komponente";
}

function isComponentPart(p: Part): boolean {
  return (
    p.partKind === "profil" ||
    p.partKind === "befestigung" ||
    p.partKind === "sonstig" ||
    p.moduleKind === "profil"
  );
}

export function TaskProfilePanel({ task }: { task: Task }) {
  const { state, getPart } = useStore();
  const allowCreate = canCreateComponents(task.type);
  const linked = task.partId ? getPart(task.partId) : undefined;

  const bezugCandidates = useMemo(() => {
    return state.parts
      .filter((p) => p.projectId === task.projectId && isBezugLike(p))
      .sort((a, b) => a.partNumber.localeCompare(b.partNumber));
  }, [state.parts, task.projectId]);

  const [parentId, setParentId] = useState<string>(() => {
    if (linked && isBezugLike(linked)) return linked.id;
    if (linked?.parentPartId) return linked.parentPartId;
    return bezugCandidates[0]?.id ?? "";
  });

  const parent = parentId ? getPart(parentId) : undefined;

  /** Für Shopfloor: Bauteil am Auftrag + zugehörige Profile/Komponenten */
  const shopfloorParts = useMemo(() => {
    if (!linked) return [];
    const root =
      linked.parentPartId && isComponentPart(linked)
        ? getPart(linked.parentPartId) ?? linked
        : linked;
    const kids = state.parts.filter(
      (p) =>
        p.projectId === task.projectId &&
        (p.parentPartId === root.id || p.usedOnPartIds?.includes(root.id)) &&
        isComponentPart(p),
    );
    const list = [root, ...kids.filter((k) => k.id !== root.id)];
    if (linked.id !== root.id && !list.some((p) => p.id === linked.id)) {
      list.unshift(linked);
    }
    return list;
  }, [linked, state.parts, task.projectId, getPart]);

  const childrenOnParent = useMemo(() => {
    if (!parent) return [];
    return state.parts.filter(
      (p) =>
        p.projectId === task.projectId &&
        (p.parentPartId === parent.id || p.usedOnPartIds?.includes(parent.id)) &&
        isComponentPart(p),
    );
  }, [state.parts, parent, task.projectId]);

  if (!allowCreate) {
    return (
      <Panel title="Bauteil-Daten">
        <p className="mb-3 text-sm text-[var(--ink-muted)]">
          Bei Zuschnitt, Näherei und Fertigung nur vorhandene Daten öffnen – Profile und
          Komponenten werden in der <strong>Entwicklung</strong> angelegt.
        </p>

        {!linked ? (
          <p className="text-sm text-[var(--ink-subtle)]">
            Kein Bauteil an diesem Auftrag verknüpft.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {shopfloorParts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/parts/${p.id}${task.revisionStand ? `?stand=${task.revisionStand}` : ""}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 transition hover:bg-[var(--bg-elevated)]"
                >
                  <div>
                    <p className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
                      <span className="font-mono">{p.partNumber}</span>
                      <span className="text-[var(--ink-subtle)]"> · </span>
                      {p.name}
                    </p>
                    <p className="text-xs text-[var(--ink-subtle)]">
                      {p.id === linked.id ? "Auftrag-Bauteil" : "Zugehörig"} · Daten öffnen →
                    </p>
                  </div>
                  <StatusPill tone={isComponentPart(p) ? "accent" : "ok"}>
                    {isBezugLike(p) && !isComponentPart(p) ? "Bezug" : kindPill(p)}
                  </StatusPill>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    );
  }

  return (
    <Panel title="Profile & Komponenten">
      <p className="mb-3 text-sm text-[var(--ink-muted)]">
        In der Entwicklung: Profile (z. B. OKR) und Komponenten am Bezug anlegen – optional mit
        CAD-Auftrag.
      </p>

      {!linked ? (
        <p className="mb-3 text-sm text-[var(--ink-subtle)]">
          Kein Bauteil am Auftrag – Bezug wählen, an dem Profil/Komponente hängt.
        </p>
      ) : null}

      <div className="mb-4">
        <Field label="Bezug (Eltern-Bauteil)">
          <select
            className={inputClass}
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">— Bezug wählen —</option>
            {bezugCandidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.partNumber} – {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {parent ? (
        <>
          {childrenOnParent.length > 0 ? (
            <ul className="mb-4 divide-y divide-[var(--line)]">
              {childrenOnParent.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link
                    href={`/parts/${p.id}`}
                    className="text-sm font-medium hover:text-[var(--accent)]"
                  >
                    <span className="font-mono text-[var(--accent)]">{p.partNumber}</span>
                    <span className="text-[var(--ink-subtle)]"> · </span>
                    {p.name}
                  </Link>
                  <StatusPill tone="accent">{kindPill(p)}</StatusPill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-[var(--ink-subtle)]">
              Noch keine Profile oder Komponenten an {parent.partNumber}.
            </p>
          )}
          <AssemblyAddButton parent={parent} />
        </>
      ) : (
        <p className="text-sm text-[var(--ink-subtle)]">
          Bitte einen Bezug wählen, um Profil oder Komponente anzulegen.
        </p>
      )}
    </Panel>
  );
}
