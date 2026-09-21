"use client";

import { useMemo, useState } from "react";
import { Button, Field, Panel, StatusPill, inputClass } from "@/components/ui";
import {
  BUILTIN_PROGRAM_TEMPLATES,
  DESIGN_TAG_OPTIONS,
  SIDE_MODE_OPTIONS,
  countTemplateStats,
  seatDisplayLabel,
  templateToPartialConfig,
} from "@/lib/program-templates";
import {
  EQUIPMENT_OPTIONS,
  supplyScopeHint,
  supplyScopeLabel,
} from "@/lib/structure";
import { useStore } from "@/lib/store";
import type {
  ProgramCreateConfig,
  ProgramRowConfig,
  ProgramSeatConfig,
  ProgramTemplate,
  SupplyScope,
} from "@/lib/types";

const CUSTOMERS = ["Audi", "BMW", "Mercedes", "Daimler", "Volkswagen", "Porsche"];
const ROW_PRESETS = ["1. Reihe", "2. Reihe", "3. Reihe"];
const SEAT_PRESETS = ["Sportsitz", "Normalsitz", "Sitzbank", "Komfortsitz", "Individuell"];
const COVER_PRESETS = ["Leder", "Kunstleder", "Stoff", "Alcantara", "Velours"];

type Step = 0 | 1 | 2 | 3 | 4;

function emptySeat(label = "Normalsitz"): ProgramSeatConfig {
  return {
    label,
    covers: ["Leder"],
    designTags: [],
    sideMode: "einzeln",
  };
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CreateProgramWizard({
  onCancel,
  onCreated,
}: {
  onCancel?: () => void;
  onCreated?: (projectId: string) => void;
}) {
  const { state, addConfiguredProject, saveProgramTemplate, deleteProgramTemplate } =
    useStore();
  const [step, setStep] = useState<Step>(0);
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [customer, setCustomer] = useState("Audi");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [supplyScope, setSupplyScope] = useState<SupplyScope>("bezug_schnittstelle");
  const [equipment, setEquipment] = useState<string[]>(["sitzheizung"]);
  const [rows, setRows] = useState<ProgramRowConfig[]>([
    { label: "1. Reihe", seats: [emptySeat()] },
  ]);
  const [saveAsName, setSaveAsName] = useState("");

  const archive = useMemo(() => {
    const custom = state.programTemplates ?? [];
    return [...custom, ...BUILTIN_PROGRAM_TEMPLATES];
  }, [state.programTemplates]);

  const summary = useMemo(() => countTemplateStats(rows), [rows]);

  function applyTemplate(tpl: ProgramTemplate) {
    const partial = templateToPartialConfig(tpl);
    setTemplateId(tpl.id);
    setSupplyScope(partial.supplyScope);
    setEquipment(partial.equipment);
    setRows(partial.rows);
    setDescription(partial.description ?? "");
    if (tpl.customerHint && !CUSTOMERS.includes(customer)) {
      /* keep customer */
    }
    setStep(1);
  }

  function updateRow(index: number, patch: Partial<ProgramRowConfig>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function updateSeat(
    rowIndex: number,
    seatIndex: number,
    patch: Partial<ProgramSeatConfig>,
  ) {
    setRows((prev) =>
      prev.map((r, ri) => {
        if (ri !== rowIndex) return r;
        return {
          ...r,
          seats: r.seats.map((s, si) => (si === seatIndex ? { ...s, ...patch } : s)),
        };
      }),
    );
  }

  function canNext(): boolean {
    if (step === 0) return false;
    if (step === 1) return code.trim().length > 0 && customer.trim().length > 0;
    if (step === 2) return rows.length > 0 && rows.every((r) => r.label.trim());
    if (step === 3)
      return rows.every(
        (r) =>
          r.seats.length > 0 &&
          r.seats.every((s) => s.label.trim() && s.covers.length > 0),
      );
    return true;
  }

  function submit() {
    if (!canNext()) return;
    const config: ProgramCreateConfig = {
      code: code.trim(),
      name: name.trim() || `Programm ${code.trim().toUpperCase()}`,
      customer: customer.trim(),
      description: description.trim() || undefined,
      supplyScope,
      equipment,
      rows,
      templateId,
    };
    const project = addConfiguredProject(config);
    onCreated?.(project.id);
    window.location.href = `/projects/${project.id}`;
  }

  function saveCurrentAsTemplate() {
    const n = saveAsName.trim() || `${customer} ${code || "Vorlage"}`.trim();
    saveProgramTemplate({
      name: n,
      description:
        description.trim() ||
        `Eigene Vorlage: ${summary.rows} Reihen, ${summary.seats} Designs`,
      supplyScope,
      equipment,
      rows,
      customerHint: customer,
    });
    setSaveAsName("");
  }

  return (
    <Panel title="Neues Programm anlegen" className="mb-6 animate-fade-up">
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            [0, "Vorlage"],
            [1, "Stammdaten"],
            [2, "Sitzreihen"],
            [3, "Designs"],
            [4, "Fertig"],
          ] as const
        ).map(([n, label]) => (
          <button
            key={n}
            type="button"
            onClick={() => (n === 0 || templateId || step > 0) && n <= step && setStep(n)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              step === n
                ? "bg-[var(--accent)] text-white"
                : n < step
                  ? "border border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-subtle)]"
            }`}
          >
            {n === 0 ? label : `${n}. ${label}`}
          </button>
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-muted)]">
            Archiv: fertige Vorlagen laden – z. B. eine Reihe mit/ohne Airbag und
            verschiedenen Designs. Die Hauptachse sind Designs, nicht Links/Rechts.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {archive.map((tpl) => {
              const stats = countTemplateStats(tpl.rows);
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] p-4 text-left transition hover:border-[var(--accent)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--ink)]">{tpl.name}</p>
                    {tpl.custom ? (
                      <StatusPill tone="accent">Eigen</StatusPill>
                    ) : (
                      <StatusPill>Archiv</StatusPill>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                    {tpl.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-[var(--ink-subtle)]">
                    <span>{supplyScopeLabel[tpl.supplyScope]}</span>
                    <span>·</span>
                    <span>
                      {stats.rows} Reihe{stats.rows === 1 ? "" : "n"}
                    </span>
                    <span>·</span>
                    <span>{stats.seats} Designs</span>
                    <span>·</span>
                    <span>{stats.covers} Bezüge</span>
                  </div>
                  {tpl.custom ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className="mt-3 inline-block text-xs text-[var(--danger)] hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProgramTemplate(tpl.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          deleteProgramTemplate(tpl.id);
                        }
                      }}
                    >
                      Aus Archiv löschen
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setTemplateId("tpl-leer");
              setStep(1);
            }}
          >
            Ohne Vorlage starten
          </Button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-muted)]">
            Kunde, Programmcode und Lieferumfang.
            {templateId ? " Vorlage ist geladen – du kannst alles noch anpassen." : null}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kunde">
              <input
                className={inputClass}
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                list="program-customers"
              />
              <datalist id="program-customers">
                {CUSTOMERS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Programmcode">
              <input
                className={inputClass}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="z. B. W 990 / ABC"
              />
            </Field>
            <Field label="Bezeichnung">
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Programm ${code || "…"}`}
              />
            </Field>
            <Field label="Kurzbeschreibung">
              <input
                className={inputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--ink)]">Lieferumfang</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(supplyScopeLabel) as SupplyScope[]).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setSupplyScope(scope)}
                  className={`rounded-[var(--radius)] border px-3 py-3 text-left ${
                    supplyScope === scope
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-[var(--bg)]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {supplyScopeLabel[scope]}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    {supplyScopeHint[scope]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-muted)]">
            Sitzreihen festlegen. Designs (mit/ohne Airbag …) kommen im nächsten Schritt –
            pro Reihe, nicht als Links/Rechts.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="mr-1 self-center text-xs text-[var(--ink-subtle)]">Schnell:</span>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() =>
                  setRows(
                    ROW_PRESETS.slice(0, n).map((label) => ({
                      label,
                      seats: [
                        emptySeat(
                          n === 3 && label === "3. Reihe" ? "Sitzbank" : "Normalsitz",
                        ),
                      ],
                    })),
                  )
                }
                className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {n} Reihe{n > 1 ? "n" : ""}
              </button>
            ))}
          </div>
          <ul className="space-y-3">
            {rows.map((row, ri) => (
              <li
                key={ri}
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] p-3"
              >
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[160px] flex-1">
                    <Field label={`Reihe ${ri + 1}`}>
                      <input
                        className={inputClass}
                        value={row.label}
                        onChange={(e) => updateRow(ri, { label: e.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="flex flex-wrap gap-1 pb-0.5">
                    {ROW_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateRow(ri, { label: p })}
                        className="rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink-muted)] hover:border-[var(--accent)]"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setRows((prev) => prev.filter((_, i) => i !== ri))}
                    disabled={rows.length <= 1}
                  >
                    Entfernen
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Button
            variant="secondary"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                {
                  label: ROW_PRESETS[prev.length] ?? `${prev.length + 1}. Reihe`,
                  seats: [emptySeat()],
                },
              ])
            }
          >
            + Sitzreihe
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <p className="text-sm text-[var(--ink-muted)]">
            Pro Reihe eigene Designs anlegen (z. B. mit Airbag / ohne Airbag, Design A/B).
            Darunter die Bezüge. Seitenanlage standardmäßig „Einzeln“ – L/R ist optional,
            nicht Pflicht.
          </p>
          {rows.map((row, ri) => (
            <div
              key={ri}
              className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--ink)]">{row.label}</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      updateRow(ri, {
                        seats: [
                          ...row.seats,
                          {
                            label: "Sportsitz",
                            covers: ["Leder"],
                            designTags: ["mit_airbag", "design_a"],
                            sideMode: "einzeln",
                          },
                        ],
                      })
                    }
                  >
                    + Design mit Airbag
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      updateRow(ri, {
                        seats: [
                          ...row.seats,
                          {
                            label: "Sportsitz",
                            covers: ["Leder", "Stoff"],
                            designTags: ["ohne_airbag", "design_b"],
                            sideMode: "einzeln",
                          },
                        ],
                      })
                    }
                  >
                    + Design ohne Airbag
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {row.seats.map((seat, si) => (
                  <div
                    key={si}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-3"
                  >
                    <p className="mb-2 text-xs font-medium text-[var(--accent)]">
                      {seatDisplayLabel(seat)}
                    </p>
                    <div className="mb-2 flex flex-wrap items-end gap-2">
                      <div className="min-w-[140px] flex-1">
                        <Field label="Sitzart">
                          <input
                            className={inputClass}
                            value={seat.label}
                            onChange={(e) =>
                              updateSeat(ri, si, { label: e.target.value })
                            }
                          />
                        </Field>
                      </div>
                      <div className="flex flex-wrap gap-1 pb-0.5">
                        {SEAT_PRESETS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => updateSeat(ri, si, { label: p })}
                            className="rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink-muted)] hover:border-[var(--accent)]"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          updateRow(ri, {
                            seats: row.seats.filter((_, i) => i !== si),
                          })
                        }
                        disabled={row.seats.length <= 1}
                      >
                        Entfernen
                      </Button>
                    </div>

                    <p className="mb-1.5 text-xs font-medium text-[var(--ink-muted)]">
                      Design-Merkmale
                    </p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {DESIGN_TAG_OPTIONS.map((tag) => {
                        const on = (seat.designTags ?? []).includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() =>
                              updateSeat(ri, si, {
                                designTags: toggleInList(seat.designTags ?? [], tag.id),
                              })
                            }
                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                              on
                                ? "bg-[var(--accent)] text-white"
                                : "border border-[var(--line)] text-[var(--ink-muted)]"
                            }`}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mb-1.5 text-xs font-medium text-[var(--ink-muted)]">
                      Seitenanlage (nicht die Hauptvariante)
                    </p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {SIDE_MODE_OPTIONS.map((opt) => {
                        const on = (seat.sideMode ?? "einzeln") === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            title={opt.hint}
                            onClick={() => updateSeat(ri, si, { sideMode: opt.id })}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                              on
                                ? "bg-[var(--ink)] text-[var(--surface)]"
                                : "border border-[var(--line)] text-[var(--ink-muted)]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mb-1.5 text-xs font-medium text-[var(--ink-muted)]">
                      Bezugvarianten
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {COVER_PRESETS.map((cover) => {
                        const on = seat.covers.includes(cover);
                        return (
                          <button
                            key={cover}
                            type="button"
                            onClick={() =>
                              updateSeat(ri, si, {
                                covers: toggleInList(seat.covers, cover),
                              })
                            }
                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                              on
                                ? "bg-[var(--accent)] text-white"
                                : "border border-[var(--line)] text-[var(--ink-muted)]"
                            }`}
                          >
                            {cover}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-muted)]">
            Programmweite Ausstattung und Prüfung – danach anlegen oder als Vorlage
            ins Archiv legen.
          </p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((opt) => {
              const on = equipment.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEquipment((prev) => toggleInList(prev, opt.id))}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    on
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-subtle)]">
              Zusammenfassung
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {customer} · Programm {code.trim().toUpperCase() || "—"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill tone="ok">{supplyScopeLabel[supplyScope]}</StatusPill>
              <StatusPill>
                {summary.rows} Reihe{summary.rows === 1 ? "" : "n"}
              </StatusPill>
              <StatusPill>
                {summary.seats} Design{summary.seats === 1 ? "" : "s"}
              </StatusPill>
              <StatusPill>
                {summary.covers} Bezugvariante{summary.covers === 1 ? "" : "n"}
              </StatusPill>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
              {rows.map((r) => (
                <li key={r.label}>
                  <span className="font-medium text-[var(--ink)]">{r.label}</span>
                  <ul className="mt-1 space-y-0.5 pl-3">
                    {r.seats.map((s, i) => (
                      <li key={i}>
                        {seatDisplayLabel(s)} · {s.covers.join(", ")} ·{" "}
                        {SIDE_MODE_OPTIONS.find((o) => o.id === (s.sideMode ?? "einzeln"))
                          ?.label ?? "Einzeln"}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--radius)] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-4">
            <p className="text-sm font-medium text-[var(--ink)]">Als Vorlage ins Archiv</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Speichert die aktuelle Struktur für spätere Projektanlagen.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                className={`${inputClass} max-w-xs`}
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="Name der Vorlage"
              />
              <Button variant="secondary" onClick={saveCurrentAsTemplate}>
                Vorlage speichern
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {step > 0 ? (
          <Button
            variant="secondary"
            onClick={() => setStep((s) => (s - 1) as Step)}
          >
            Zurück
          </Button>
        ) : null}
        {step > 0 && step < 4 ? (
          <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canNext()}>
            Weiter
          </Button>
        ) : null}
        {step === 4 ? (
          <Button onClick={submit} disabled={!canNext()}>
            Programm anlegen
          </Button>
        ) : null}
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Abbrechen
          </Button>
        ) : null}
      </div>
    </Panel>
  );
}
