"use client";

import { useMemo, useState } from "react";
import { Button, Field, Modal, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { DevelopmentRole, ModuleKind } from "@/lib/types";

export function CreatePartForm({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated?: () => void;
}) {
  const { state, addPart, addLeftRightPair } = useStore();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "pair" | "virtual">("pair");
  const [form, setForm] = useState({
    structureNodeId: "",
    baseName: "",
    partNumber: "",
    partNumberLeft: "",
    partNumberRight: "",
    developSide: "links" as "links" | "rechts",
    moduleKind: "bezug" as ModuleKind,
    developmentRole: "eigenstaendig" as DevelopmentRole,
    engineerUserId: "u-david",
    coverDeveloperUserId: "u-lena",
    interfaceNote: "",
  });

  const attachNodes = useMemo(() => {
    return state.structureNodes
      .filter(
        (n) =>
          n.projectId === projectId &&
          (n.type === "bezugvariante" || n.type === "modul"),
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [state.structureNodes, projectId]);

  const defaultNode = attachNodes[0]?.id ?? "";

  function submit() {
    const structureNodeId = form.structureNodeId || defaultNode;
    if (!structureNodeId || !form.baseName.trim()) return;

    if (mode === "pair") {
      if (!form.partNumberLeft.trim() || !form.partNumberRight.trim()) return;
      addLeftRightPair({
        projectId,
        structureNodeId,
        baseName: form.baseName.trim(),
        partNumberLeft: form.partNumberLeft.trim(),
        partNumberRight: form.partNumberRight.trim(),
        developSide: form.developSide,
        moduleKind: form.moduleKind,
        engineerUserId: form.engineerUserId,
        coverDeveloperUserId: form.coverDeveloperUserId,
      });
    } else if (mode === "virtual") {
      const tn =
        form.partNumber.trim() ||
        `VIRT-${form.baseName.trim().slice(0, 12).replace(/\s+/g, "-").toUpperCase()}`;
      addPart({
        projectId,
        structureNodeId,
        name: form.baseName.trim(),
        partNumber: tn,
        side: "einzeln",
        moduleKind: "bezug",
        developmentRole: "eigenstaendig",
        engineerUserId: form.engineerUserId,
        coverDeveloperUserId: form.coverDeveloperUserId,
        currentRevision: "01",
        isVirtual: true,
        interfaceNote:
          form.interfaceNote.trim() ||
          "Virtueller Bezug – Platzhalter für frühe Entwicklung und Aufträge.",
      });
    } else {
      if (!form.partNumber.trim()) return;
      addPart({
        projectId,
        structureNodeId,
        name: form.baseName.trim(),
        partNumber: form.partNumber.trim(),
        side: "einzeln",
        moduleKind: form.moduleKind,
        developmentRole: form.developmentRole,
        engineerUserId: form.engineerUserId,
        coverDeveloperUserId:
          form.moduleKind === "bezug" || form.moduleKind === "schnittstelle"
            ? form.coverDeveloperUserId
            : undefined,
        currentRevision: "01",
        interfaceNote: form.interfaceNote.trim() || undefined,
      });
    }
    setOpen(false);
    setForm((f) => ({
      ...f,
      baseName: "",
      partNumber: "",
      partNumberLeft: "",
      partNumberRight: "",
      interfaceNote: "",
    }));
    onCreated?.();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="secondary">
        Bauteil anlegen
      </Button>
      {open ? (
        <Modal title="Bauteil anlegen" size="lg" onClose={() => setOpen(false)}>
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                ["pair", "Links + Rechts"],
                ["single", "Einzeln / Anbindung"],
                ["virtual", "Virtueller Bezug"],
              ] as const
            ).map(([m, lab]) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  if (m === "virtual") {
                    setForm((f) => ({ ...f, moduleKind: "bezug" }));
                  }
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  mode === m
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--line)] bg-[var(--surface)]"
                }`}
              >
                {lab}
              </button>
            ))}
          </div>

          {mode === "pair" ? (
            <p className="mb-4 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">
              Eine Seite wird entwickelt, die andere bekommt eine eigene Teilenummer als Spiegel.
            </p>
          ) : null}
          {mode === "virtual" ? (
            <p className="mb-4 rounded-lg bg-[var(--watch-soft)] px-3 py-2 text-sm text-[var(--watch)]">
              Virtueller Bezug: frühe Entwicklung und Aufträge ohne finale Kunden-TN. Später
              durch reales Bauteil ersetzbar.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Struktur-Knoten">
              <select
                className={inputClass}
                value={form.structureNodeId || defaultNode}
                onChange={(e) => setForm({ ...form, structureNodeId: e.target.value })}
              >
                {attachNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({n.type}
                    {n.moduleKind ? ` · ${n.moduleKind}` : ""})
                  </option>
                ))}
              </select>
            </Field>
            {mode !== "virtual" ? (
              <Field label="Modul-Art">
                <select
                  className={inputClass}
                  value={form.moduleKind}
                  onChange={(e) =>
                    setForm({ ...form, moduleKind: e.target.value as ModuleKind })
                  }
                >
                  <option value="bezug">Bezug</option>
                  <option value="schnittstelle">Anbindung</option>
                  <option value="kunststoff">Kunststoff</option>
                  <option value="schaum">Schaum</option>
                  <option value="struktur">Struktur</option>
                  <option value="metall">Metall</option>
                </select>
              </Field>
            ) : (
              <Field label="Art">
                <div className="flex h-[42px] items-center text-sm text-[var(--ink-muted)]">
                  Virtueller Bezug
                </div>
              </Field>
            )}
            <Field label="Bezeichnung">
              <input
                className={inputClass}
                value={form.baseName}
                onChange={(e) => setForm({ ...form, baseName: e.target.value })}
                placeholder={
                  mode === "virtual"
                    ? "z. B. Sportsitz Design A (virtuell)"
                    : "z. B. Sportsitz Alcantara"
                }
              />
            </Field>
            {mode === "pair" ? (
              <>
                <Field label="Welche Seite wird entwickelt?">
                  <select
                    className={inputClass}
                    value={form.developSide}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        developSide: e.target.value as "links" | "rechts",
                      })
                    }
                  >
                    <option value="links">Links – Rechts = Spiegel</option>
                    <option value="rechts">Rechts – Links = Spiegel</option>
                  </select>
                </Field>
                <Field label="Teilenummer Links">
                  <input
                    className={inputClass}
                    value={form.partNumberLeft}
                    onChange={(e) =>
                      setForm({ ...form, partNumberLeft: e.target.value })
                    }
                  />
                </Field>
                <Field label="Teilenummer Rechts">
                  <input
                    className={inputClass}
                    value={form.partNumberRight}
                    onChange={(e) =>
                      setForm({ ...form, partNumberRight: e.target.value })
                    }
                  />
                </Field>
              </>
            ) : (
              <>
                <Field
                  label={
                    mode === "virtual"
                      ? "Platzhalter-TN (optional)"
                      : "Teilenummer"
                  }
                >
                  <input
                    className={inputClass}
                    value={form.partNumber}
                    onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                    placeholder={mode === "virtual" ? "wird auto-generiert" : ""}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Hinweis (optional)">
                    <input
                      className={inputClass}
                      value={form.interfaceNote}
                      onChange={(e) =>
                        setForm({ ...form, interfaceNote: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </>
            )}
            <Field label="Ingenieur">
              <select
                className={inputClass}
                value={form.engineerUserId}
                onChange={(e) => setForm({ ...form, engineerUserId: e.target.value })}
              >
                {state.users
                  .filter(
                    (u) => u.demoRole === "engineering" || u.demoRole === "manager",
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Bezugsentwickler">
              <select
                className={inputClass}
                value={form.coverDeveloperUserId}
                onChange={(e) =>
                  setForm({ ...form, coverDeveloperUserId: e.target.value })
                }
              >
                {state.users
                  .filter((u) => u.demoRole !== "extern")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={submit}>Speichern</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
