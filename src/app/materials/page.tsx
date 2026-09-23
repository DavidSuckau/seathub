"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Field,
  Modal,
  PageHeader,
  Panel,
  StatusPill,
  inputClass,
} from "@/components/ui";
import {
  formatMaterialPrice,
  formatStock,
  materialArtLabel,
  materialArts,
  materialEinheiten,
  stockTone,
} from "@/lib/materials";
import { useStore } from "@/lib/store";
import type { Material, MaterialArt, MaterialEinheit } from "@/lib/types";

type FormState = {
  kaufnummer: string;
  beschreibung: string;
  art: MaterialArt;
  einheit: MaterialEinheit;
  preis: string;
  lieferant: string;
  lagerplatz: string;
  verfuegbar: string;
};

const emptyForm = (): FormState => ({
  kaufnummer: "",
  beschreibung: "",
  art: "leder",
  einheit: "m",
  preis: "",
  lieferant: "",
  lagerplatz: "",
  verfuegbar: "0",
});

function fromMaterial(m: Material): FormState {
  return {
    kaufnummer: m.kaufnummer,
    beschreibung: m.beschreibung,
    art: m.art,
    einheit: m.einheit,
    preis: String(m.preis),
    lieferant: m.lieferant,
    lagerplatz: m.lagerplatz,
    verfuegbar: String(m.verfuegbar),
  };
}

export default function MaterialsPage() {
  const { state, addMaterial, updateMaterial, deleteMaterial } = useStore();
  const materials = state.materials ?? [];
  const [query, setQuery] = useState("");
  const [artFilter, setArtFilter] = useState<MaterialArt | "alle">("alle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return materials
      .filter((m) => (artFilter === "alle" ? true : m.art === artFilter))
      .filter((m) => {
        if (!q) return true;
        return (
          m.kaufnummer.toLowerCase().includes(q) ||
          m.beschreibung.toLowerCase().includes(q) ||
          m.lieferant.toLowerCase().includes(q) ||
          m.lagerplatz.toLowerCase().includes(q) ||
          materialArtLabel[m.art].toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.kaufnummer.localeCompare(b.kaufnummer, "de"));
  }, [materials, query, artFilter]);

  const lowStock = materials.filter((m) => m.verfuegbar <= 0).length;

  function openCreate() {
    setCreating(true);
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  }

  function openEdit(m: Material) {
    setCreating(false);
    setEditingId(m.id);
    setForm(fromMaterial(m));
    setError(null);
  }

  function closeModal() {
    setCreating(false);
    setEditingId(null);
    setError(null);
  }

  function save() {
    setError(null);
    if (!form.kaufnummer.trim()) {
      setError("Kaufnummer fehlt.");
      return;
    }
    if (!form.beschreibung.trim()) {
      setError("Beschreibung fehlt.");
      return;
    }
    const preis = Number(String(form.preis).replace(",", "."));
    const verfuegbar = Number(String(form.verfuegbar).replace(",", "."));
    if (!Number.isFinite(preis) || preis < 0) {
      setError("Preis ungültig.");
      return;
    }
    if (!Number.isFinite(verfuegbar) || verfuegbar < 0) {
      setError("Lagerbestand ungültig.");
      return;
    }
    const payload = {
      kaufnummer: form.kaufnummer.trim(),
      beschreibung: form.beschreibung.trim(),
      art: form.art,
      einheit: form.einheit,
      preis,
      lieferant: form.lieferant.trim() || "—",
      lagerplatz: form.lagerplatz.trim() || "—",
      verfuegbar,
    };
    if (editingId) {
      updateMaterial(editingId, payload);
    } else {
      addMaterial(payload);
    }
    closeModal();
  }

  const modalOpen = creating || editingId != null;

  return (
    <div>
      <PageHeader
        eyebrow="Stammdaten"
        title="Materialdatenbank"
        description="Kaufnummer, Beschreibung, Art, Einheit, Preis, Lieferant, Lagerplatz und Bestand."
        actions={<Button onClick={openCreate}>Material anlegen</Button>}
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <Field label="Suche">
            <input
              className={inputClass}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kaufnummer, Beschreibung, Lieferant…"
            />
          </Field>
        </div>
        <div className="w-full sm:w-48">
          <Field label="Art">
            <select
              className={inputClass}
              value={artFilter}
              onChange={(e) =>
                setArtFilter(e.target.value as MaterialArt | "alle")
              }
            >
              <option value="alle">Alle Arten</option>
              {materialArts.map((a) => (
                <option key={a} value={a}>
                  {materialArtLabel[a]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2 pb-1">
          <StatusPill tone="accent">{materials.length} Materialien</StatusPill>
          {lowStock > 0 ? (
            <StatusPill tone="warn">{lowStock} nicht verfügbar</StatusPill>
          ) : (
            <StatusPill tone="ok">Lager ok</StatusPill>
          )}
        </div>
      </div>

      <Panel>
        {filtered.length === 0 ? (
          <p className="py-6 text-sm text-[var(--ink-subtle)]">
            Keine Materialien gefunden.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.08em] text-[var(--ink-subtle)]">
                  <th className="pb-2 pr-3 font-medium">Kaufnummer</th>
                  <th className="pb-2 pr-3 font-medium">Beschreibung</th>
                  <th className="pb-2 pr-3 font-medium">Art</th>
                  <th className="pb-2 pr-3 font-medium">Einheit</th>
                  <th className="pb-2 pr-3 font-medium">Preis</th>
                  <th className="pb-2 pr-3 font-medium">Lieferant</th>
                  <th className="pb-2 pr-3 font-medium">Lagerplatz</th>
                  <th className="pb-2 font-medium">Verfügbar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="cursor-pointer hover:bg-[var(--bg-elevated)]"
                    onClick={() => openEdit(m)}
                  >
                    <td className="py-2.5 pr-3 font-mono text-[13px] text-[var(--accent)]">
                      {m.kaufnummer}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-[var(--ink)]">
                      {m.beschreibung}
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--ink-muted)]">
                      {materialArtLabel[m.art]}
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--ink-muted)]">
                      {m.einheit}
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--ink-muted)]">
                      {formatMaterialPrice(m.preis, m.einheit)}
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--ink-muted)]">
                      {m.lieferant}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[13px] text-[var(--ink-muted)]">
                      {m.lagerplatz}
                    </td>
                    <td className="py-2.5">
                      <StatusPill tone={stockTone(m.verfuegbar)}>
                        {formatStock(m.verfuegbar, m.einheit)}
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {modalOpen ? (
        <Modal
          title={editingId ? "Material bearbeiten" : "Neues Material"}
          onClose={closeModal}
          size="lg"
        >
          {error ? (
            <p className="mb-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kaufnummer *">
              <input
                className={inputClass}
                value={form.kaufnummer}
                onChange={(e) =>
                  setForm({ ...form, kaufnummer: e.target.value })
                }
                placeholder="z. B. MAT-LED-4410"
                autoFocus
              />
            </Field>
            <Field label="Art">
              <select
                className={inputClass}
                value={form.art}
                onChange={(e) =>
                  setForm({ ...form, art: e.target.value as MaterialArt })
                }
              >
                {materialArts.map((a) => (
                  <option key={a} value={a}>
                    {materialArtLabel[a]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Beschreibung *">
                <input
                  className={inputClass}
                  value={form.beschreibung}
                  onChange={(e) =>
                    setForm({ ...form, beschreibung: e.target.value })
                  }
                  placeholder="z. B. Nappa Leder schwarz"
                />
              </Field>
            </div>
            <Field label="Einheit">
              <select
                className={inputClass}
                value={form.einheit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    einheit: e.target.value as MaterialEinheit,
                  })
                }
              >
                {materialEinheiten.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preis (EUR je Einheit)">
              <input
                type="number"
                min={0}
                step={0.01}
                className={inputClass}
                value={form.preis}
                onChange={(e) => setForm({ ...form, preis: e.target.value })}
                placeholder="0,00"
              />
            </Field>
            <Field label="Lieferant">
              <input
                className={inputClass}
                value={form.lieferant}
                onChange={(e) =>
                  setForm({ ...form, lieferant: e.target.value })
                }
              />
            </Field>
            <Field label="Lagerplatz">
              <input
                className={inputClass}
                value={form.lagerplatz}
                onChange={(e) =>
                  setForm({ ...form, lagerplatz: e.target.value })
                }
                placeholder="z. B. H-A-12"
              />
            </Field>
            <Field label="Verfügbar auf Lager">
              <input
                type="number"
                min={0}
                step={0.1}
                className={inputClass}
                value={form.verfuegbar}
                onChange={(e) =>
                  setForm({ ...form, verfuegbar: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={save}>
              {editingId ? "Speichern" : "Anlegen"}
            </Button>
            <Button variant="ghost" onClick={closeModal}>
              Abbrechen
            </Button>
            {editingId ? (
              <Button
                variant="danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Material wirklich aus der Datenbank entfernen?",
                    )
                  ) {
                    deleteMaterial(editingId);
                    closeModal();
                  }
                }}
              >
                Löschen
              </Button>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
