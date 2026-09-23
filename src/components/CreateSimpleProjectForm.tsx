"use client";

import { useState } from "react";
import { Button, Field, Modal, inputClass } from "@/components/ui";
import { navigate } from "@/lib/nav";
import { useStore } from "@/lib/store";
import type { SupplyScope } from "@/lib/types";

/**
 * Kleines Programm anlegen – ohne vorab die ganze Sitzstruktur.
 * Struktur wächst später mit den Bauteilen.
 */
export function CreateSimpleProjectForm() {
  const { addSimpleProject } = useStore();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer: "",
    code: "",
    name: "",
    supplyScope: "komplettsitz" as SupplyScope,
  });

  function submit() {
    setError(null);
    if (!form.customer.trim()) {
      setError("Kunde fehlt.");
      return;
    }
    if (!form.code.trim()) {
      setError("Programmcode fehlt.");
      return;
    }
    const project = addSimpleProject({
      customer: form.customer.trim(),
      code: form.code.trim(),
      name: form.name.trim() || undefined,
      supplyScope: form.supplyScope,
    });
    setOpen(false);
    setForm({
      customer: "",
      code: "",
      name: "",
      supplyScope: "komplettsitz",
    });
    navigate(`/projects/${project.id}`);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Neues Projekt</Button>
      {open ? (
        <Modal title="Neues Projekt" size="md" onClose={() => setOpen(false)}>
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Nur Kunde und Programm – Sitzreihen und Bauteile legst du danach Stück für Stück an.
          </p>
          {error ? (
            <p className="mb-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}
          <div className="grid gap-3">
            <Field label="Kunde">
              <input
                className={inputClass}
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                placeholder="z. B. Mercedes-Benz"
                autoFocus
              />
            </Field>
            <Field label="Programmcode">
              <input
                className={inputClass}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="z. B. W990"
              />
            </Field>
            <Field label="Name (optional)">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="wird aus Code erzeugt"
              />
            </Field>
            <Field label="Leistungsumfang">
              <select
                className={inputClass}
                value={form.supplyScope}
                onChange={(e) =>
                  setForm({
                    ...form,
                    supplyScope: e.target.value as SupplyScope,
                  })
                }
              >
                <option value="bezug">Nur Bezug</option>
                <option value="bezug_schnittstelle">Bezug + Anbindung</option>
                <option value="komplettsitz">Komplettsitz</option>
              </select>
            </Field>
          </div>
          <div className="mt-5 flex gap-2">
            <Button onClick={submit}>Anlegen</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
