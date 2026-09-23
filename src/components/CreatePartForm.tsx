"use client";

import { useMemo, useRef, useState } from "react";
import { readImageFile } from "@/components/LopPhotoGallery";
import { Button, Field, Modal, inputClass } from "@/components/ui";
import { navigateToPart, withBasePath } from "@/lib/nav";
import { pickDemoPartImage } from "@/lib/part-images";
import { getNodePath, moduleKindLabel } from "@/lib/structure";
import { useStore } from "@/lib/store";
import type { ModuleKind, PartKind, PartSide } from "@/lib/types";

const KINDS: { id: ModuleKind; partKind: PartKind }[] = [
  { id: "bezug", partKind: "hauptteil" },
  { id: "schaum", partKind: "schaum" },
  { id: "kunststoff", partKind: "hauptteil" },
  { id: "struktur", partKind: "hauptteil" },
  { id: "schnittstelle", partKind: "hauptteil" },
  { id: "profil", partKind: "profil" },
];

export function CreatePartForm({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated?: () => void;
}) {
  const { state, addPart, addRevision, addLeftRightPair, updatePart } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    structureNodeId: "",
    moduleKind: "bezug" as ModuleKind,
    partNumber: "",
    name: "",
    side: "einzeln" as PartSide,
    imageUrl: "" as string,
    pair: false,
    partNumberRight: "",
    virtual: false,
  });

  const attachNodes = useMemo(() => {
    return state.structureNodes
      .filter(
        (n) =>
          n.projectId === projectId &&
          (n.type === "bezugvariante" || n.type === "modul"),
      )
      .map((n) => ({
        id: n.id,
        label: getNodePath(state.structureNodes, n.id)
          .map((p) => p.label)
          .join(" · "),
        moduleKind: n.moduleKind,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [state.structureNodes, projectId]);

  const defaultNode = attachNodes[0]?.id ?? "";
  const kindMeta = KINDS.find((k) => k.id === form.moduleKind) ?? KINDS[0];
  const previewSrc = form.imageUrl.startsWith("data:")
    ? form.imageUrl
    : withBasePath(
        form.imageUrl ||
          pickDemoPartImage({
            name: form.name || form.moduleKind,
            moduleKind: form.moduleKind,
            partKind: kindMeta.partKind,
          }),
      );

  function reset() {
    setForm({
      structureNodeId: "",
      moduleKind: "bezug",
      partNumber: "",
      name: "",
      side: "einzeln",
      imageUrl: "",
      pair: false,
      partNumberRight: "",
      virtual: false,
    });
    setMore(false);
    setError(null);
  }

  async function onPickImage(files: FileList | null) {
    if (!files?.[0]) return;
    setBusy(true);
    setError(null);
    try {
      const url = await readImageFile(files[0]);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bild fehlgeschlagen.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submit() {
    setError(null);
    const structureNodeId = form.structureNodeId || defaultNode;
    if (!structureNodeId) {
      setError("Keine Struktur im Programm – zuerst Sitzstruktur anlegen.");
      return;
    }
    if (!form.name.trim()) {
      setError("Beschreibung fehlt.");
      return;
    }
    if (!form.virtual && !form.partNumber.trim()) {
      setError("Teilenummer fehlt.");
      return;
    }

    const imageUrl =
      form.imageUrl.trim() ||
      pickDemoPartImage({
        name: form.name.trim(),
        moduleKind: form.moduleKind,
        partKind: kindMeta.partKind,
      });

    let openId: string | undefined;

    if (form.pair && !form.virtual) {
      if (!form.partNumberRight.trim()) {
        setError("Teilenummer Rechts fehlt.");
        return;
      }
      const pair = addLeftRightPair({
        projectId,
        structureNodeId,
        baseName: form.name.trim(),
        partNumberLeft: form.partNumber.trim(),
        partNumberRight: form.partNumberRight.trim(),
        developSide: "links",
        moduleKind: form.moduleKind,
        engineerUserId: state.currentUserId,
      });
      if (form.imageUrl.trim()) {
        updatePart(pair.master.id, { imageUrl });
        updatePart(pair.mirror.id, { imageUrl });
      }
      openId = pair.master.id;
    } else {
      const tn =
        form.partNumber.trim() ||
        `VIRT-${form.name.trim().slice(0, 12).replace(/\s+/g, "-").toUpperCase()}`;
      const created = addPart({
        projectId,
        structureNodeId,
        name: form.name.trim(),
        partNumber: tn,
        side: form.side,
        moduleKind: form.moduleKind,
        partKind: kindMeta.partKind,
        developmentRole: "eigenstaendig",
        engineerUserId: state.currentUserId,
        coverDeveloperUserId:
          form.moduleKind === "bezug" || form.moduleKind === "schnittstelle"
            ? state.currentUserId
            : undefined,
        currentRevision: "01",
        isVirtual: form.virtual || undefined,
        imageUrl,
        interfaceNote: form.virtual
          ? "Virtueller Bezug – Platzhalter für frühe Entwicklung."
          : undefined,
      });
      addRevision({
        partId: created.id,
        revision: "01",
        title: "Erststand",
        date: new Date().toISOString().slice(0, 10),
        createdByUserId: state.currentUserId,
        userType: "intern",
        reason: "Bauteil angelegt",
        status: "in_entwicklung",
        drawings: [],
        photos: [],
        documents: [],
        bomItems: [],
        files: [],
      });
      openId = created.id;
    }

    setOpen(false);
    reset();
    onCreated?.();
    if (openId) navigateToPart(openId);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Neues Bauteil</Button>
      {open ? (
        <Modal title="Neues Bauteil" size="lg" onClose={() => setOpen(false)}>
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Ort, Nummer, Beschreibung – fertig. Rest nur wenn nötig.
          </p>

          {attachNodes.length === 0 ? (
            <p className="mb-4 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              Zuerst Sitzstruktur anlegen (Module / Bezugvarianten), dann Bauteile.
            </p>
          ) : null}
          {error ? (
            <p className="mb-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="space-y-3">
              <Field label="Wo gehört das hin?">
                <select
                  className={inputClass}
                  value={form.structureNodeId || defaultNode}
                  disabled={attachNodes.length === 0}
                  onChange={(e) => {
                    const id = e.target.value;
                    const node = attachNodes.find((n) => n.id === id);
                    setForm((f) => ({
                      ...f,
                      structureNodeId: id,
                      moduleKind:
                        (node?.moduleKind as ModuleKind | undefined) ?? f.moduleKind,
                    }));
                  }}
                >
                  {attachNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Art">
                <div className="flex flex-wrap gap-1.5">
                  {KINDS.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, moduleKind: k.id }))}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        form.moduleKind === k.id
                          ? "bg-[var(--accent)] text-white"
                          : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
                      }`}
                    >
                      {moduleKindLabel[k.id]}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Teilenummer">
                <input
                  className={inputClass}
                  value={form.partNumber}
                  onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                  placeholder={form.virtual ? "optional – wird erzeugt" : "z. B. A990-1S-ALC-L"}
                  autoFocus
                />
              </Field>

              <Field label="Beschreibung">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="z. B. Sportsitz Alcantara Links"
                />
              </Field>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-[var(--ink)]">Bild</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] border border-dashed border-[var(--line-strong)] bg-[var(--bg)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt=""
                  className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                />
                <span className="absolute inset-x-0 bottom-0 bg-[#10151a]/65 px-2 py-1 text-center text-[11px] text-white">
                  {busy ? "Lädt…" : form.imageUrl ? "Ersetzen" : "Foto wählen"}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            className="mt-4 text-sm text-[var(--accent)] hover:underline"
          >
            {more ? "Weniger Optionen" : "Weitere Optionen"}
          </button>

          {more ? (
            <div className="mt-3 grid gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] p-3 sm:grid-cols-2">
              <Field label="Seite">
                <select
                  className={inputClass}
                  value={form.side}
                  onChange={(e) =>
                    setForm({ ...form, side: e.target.value as PartSide })
                  }
                >
                  <option value="einzeln">Einzeln</option>
                  <option value="links">Links</option>
                  <option value="rechts">Rechts</option>
                  <option value="mitte">Mitte</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm text-[var(--ink-muted)] sm:mt-6">
                <input
                  type="checkbox"
                  checked={form.virtual}
                  onChange={(e) =>
                    setForm({ ...form, virtual: e.target.checked, pair: false })
                  }
                />
                Virtueller Bezug (ohne finale TN)
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
                <input
                  type="checkbox"
                  checked={form.pair}
                  disabled={form.virtual}
                  onChange={(e) => setForm({ ...form, pair: e.target.checked })}
                />
                Links + Rechts als Paar
              </label>
              {form.pair ? (
                <Field label="Teilenummer Rechts">
                  <input
                    className={inputClass}
                    value={form.partNumberRight}
                    onChange={(e) =>
                      setForm({ ...form, partNumberRight: e.target.value })
                    }
                    placeholder="TN Rechts"
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex gap-2">
            <Button onClick={submit} disabled={attachNodes.length === 0 || busy}>
              Anlegen
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
