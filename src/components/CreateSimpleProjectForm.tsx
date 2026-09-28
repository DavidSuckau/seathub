"use client";

import { useState } from "react";
import { Button, Field, Modal, inputClass } from "@/components/ui";
import { navigate } from "@/lib/nav";
import { useStore } from "@/lib/store";
import type { SupplyScope } from "@/lib/types";

/**
 * Programm anlegen – ohne vorab die ganze Sitzstruktur.
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

  function close() {
    setOpen(false);
    setError(null);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Neues Projekt</Button>
      {open ? (
        <Modal title="Neues Projekt" size="xl" onClose={close}>
          <p className="mb-5 max-w-2xl text-sm text-[var(--ink-muted)]">
            Nur Kunde und Programm anlegen. Sitzreihen und Bauteile kommen danach
            Stück für Stück – die Struktur wächst mit.
          </p>
          {error ? (
            <p className="mb-4 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Kunde *">
              <input
                className={inputClass}
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                placeholder="z. B. Mercedes-Benz"
                autoFocus
              />
            </Field>
            <Field label="Programmcode *">
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
                placeholder="wird aus Code erzeugt, z. B. Programm W990"
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

          <div className="mt-6 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-muted)]">
            <p className="font-medium text-[var(--ink)]">Danach</p>
            <p className="mt-1">
              Im Projekt Bauteile anlegen (Bezug, Schaum, Profil …). Sitzreihen und
              Varianten entstehen automatisch mit den Bauteilen.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--line)] pt-5">
            <Button onClick={submit}>Projekt anlegen</Button>
            <Button variant="ghost" onClick={close}>
              Abbrechen
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
