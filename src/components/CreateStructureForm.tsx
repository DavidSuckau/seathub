"use client";

import { useMemo, useState } from "react";
import { Button, Field, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { structureTypeLabel } from "@/lib/structure";

type AddKind = "sitzreihe" | "sitzvariante" | "bezugvariante";

const ROW_PRESETS = ["1. Reihe", "2. Reihe", "3. Reihe", "Fond"];
const SEAT_PRESETS = ["Sportsitz", "Normalsitz", "Sitzbank", "Individuell", "Komfortsitz"];
const COVER_PRESETS = ["Alcantara", "Leder", "Stoff", "Kunstleder", "Velours"];

export function CreateStructureForm({ projectId }: { projectId: string }) {
  const { state, addStructureNode, addSeatVariantWithModules, addCoverVariant } = useStore();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<AddKind>("sitzreihe");
  const [label, setLabel] = useState("");
  const [parentId, setParentId] = useState("");

  const rows = useMemo(
    () =>
      state.structureNodes
        .filter((n) => n.projectId === projectId && n.type === "sitzreihe")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [state.structureNodes, projectId],
  );

  const seatVariants = useMemo(
    () =>
      state.structureNodes
        .filter((n) => n.projectId === projectId && n.type === "sitzvariante")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [state.structureNodes, projectId],
  );

  const presets =
    kind === "sitzreihe" ? ROW_PRESETS : kind === "sitzvariante" ? SEAT_PRESETS : COVER_PRESETS;

  function reset() {
    setOpen(false);
    setKind("sitzreihe");
    setLabel("");
    setParentId("");
  }

  function submit() {
    const name = label.trim();
    if (!name) return;

    if (kind === "sitzreihe") {
      const sortOrder = rows.length + 1;
      addStructureNode({
        projectId,
        parentId: null,
        type: "sitzreihe",
        label: name,
        sortOrder,
      });
      reset();
      return;
    }

    if (kind === "sitzvariante") {
      const parent = parentId || rows[0]?.id;
      if (!parent) return;
      addSeatVariantWithModules({
        projectId,
        parentRowId: parent,
        label: name,
      });
      reset();
      return;
    }

    const seat = parentId || seatVariants[0]?.id;
    if (!seat) return;
    addCoverVariant({
      projectId,
      seatVariantId: seat,
      label: name,
    });
    reset();
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Struktur erweitern
      </Button>
    );
  }

  return (
    <Panel title="Projektstruktur erweitern" className="mb-4">
      <p className="mb-3 text-sm text-[var(--ink-muted)]">
        Sitzreihen → Sitzarten (z. B. Sportsitz) → Bezugvarianten (Alcantara, Leder, Stoff). Bei
        einer neuen Sitzart werden die Module automatisch je Lieferumfang angelegt.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["sitzreihe", "Sitzreihe"],
            ["sitzvariante", "Sitzart"],
            ["bezugvariante", "Bezugvariante"],
          ] as const
        ).map(([k, lab]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setLabel("");
              setParentId("");
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              kind === k
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
            }`}
          >
            {lab}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {kind === "sitzvariante" ? (
          <Field label="Unter Sitzreihe">
            <select
              className={inputClass}
              value={parentId || rows[0]?.id || ""}
              onChange={(e) => setParentId(e.target.value)}
            >
              {rows.length === 0 ? (
                <option value="">Zuerst Sitzreihe anlegen</option>
              ) : (
                rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))
              )}
            </select>
          </Field>
        ) : null}

        {kind === "bezugvariante" ? (
          <Field label="Unter Sitzart">
            <select
              className={inputClass}
              value={parentId || seatVariants[0]?.id || ""}
              onChange={(e) => setParentId(e.target.value)}
            >
              {seatVariants.length === 0 ? (
                <option value="">Zuerst Sitzart anlegen</option>
              ) : (
                seatVariants.map((s) => {
                  const row = state.structureNodes.find((n) => n.id === s.parentId);
                  return (
                    <option key={s.id} value={s.id}>
                      {row ? `${row.label} · ` : ""}
                      {s.label}
                    </option>
                  );
                })
              )}
            </select>
          </Field>
        ) : null}

        <Field
          label={
            kind === "sitzreihe"
              ? "Bezeichnung der Reihe"
              : kind === "sitzvariante"
                ? "Sitzart (z. B. Sportsitz)"
                : "Bezugvariante (z. B. Alcantara)"
          }
        >
          <input
            className={inputClass}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={presets[0]}
          />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="mr-1 self-center text-xs text-[var(--ink-subtle)]">Schnell:</span>
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setLabel(p)}
            className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={submit}
          disabled={
            !label.trim() ||
            (kind === "sitzvariante" && rows.length === 0) ||
            (kind === "bezugvariante" && seatVariants.length === 0)
          }
        >
          {kind === "sitzreihe"
            ? "Sitzreihe anlegen"
            : kind === "sitzvariante"
              ? "Sitzart anlegen"
              : "Bezugvariante anlegen"}
        </Button>
        <Button variant="ghost" onClick={reset}>
          Abbrechen
        </Button>
      </div>

      {kind === "sitzvariante" ? (
        <p className="mt-3 text-xs text-[var(--ink-subtle)]">
          Legt automatisch Modul „Bezug“ an
          {state.projects.find((p) => p.id === projectId)?.supplyScope === "komplettsitz"
            ? " sowie Kunststoff, Schaum und Struktur"
            : state.projects.find((p) => p.id === projectId)?.supplyScope ===
                "bezug_schnittstelle"
              ? " sowie Anbindung"
              : ""}
          .
        </p>
      ) : null}

      {kind === "bezugvariante" ? (
        <p className="mt-3 text-xs text-[var(--ink-subtle)]">
          Die Variante hängt unter dem Bezug-Modul der gewählten Sitzart (
          {structureTypeLabel.bezugvariante}). Danach können Bauteile / Teilenummern angelegt
          werden.
        </p>
      ) : null}
    </Panel>
  );
}
