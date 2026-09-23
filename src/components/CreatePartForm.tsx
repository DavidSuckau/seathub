"use client";

import { useMemo, useRef, useState } from "react";
import { readImageFile } from "@/components/LopPhotoGallery";
import { Button, Field, Modal, inputClass } from "@/components/ui";
import { navigateToPart, withBasePath } from "@/lib/nav";
import { demoDxfAttachment } from "@/lib/dxf-demo";
import { pickDemoPartImage } from "@/lib/part-images";
import { moduleKindLabel } from "@/lib/structure";
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

const ROW_PRESETS = ["1. Reihe", "2. Reihe", "3. Reihe"];
const SEAT_PRESETS = ["Sportsitz", "Normalsitz", "Sitzbank", "Komfortsitz"];
const COVER_PRESETS = ["Alcantara", "Leder", "Stoff", "Kunstleder"];

export function CreatePartForm({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated?: () => void;
}) {
  const {
    state,
    addPart,
    addRevision,
    resolveStructureForPart,
    updatePart,
    addLeftRightPair,
  } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    moduleKind: "bezug" as ModuleKind,
    rowLabel: "",
    seatLabel: "",
    coverLabel: "Leder",
    partNumber: "",
    name: "",
    dueDate: "",
    side: "einzeln" as PartSide,
    imageUrl: "",
    pair: false,
    partNumberRight: "",
  });

  const rows = useMemo(
    () =>
      state.structureNodes
        .filter((n) => n.projectId === projectId && n.type === "sitzreihe")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [state.structureNodes, projectId],
  );

  const seats = useMemo(() => {
    const row = rows.find(
      (r) => r.label.toLowerCase() === form.rowLabel.trim().toLowerCase(),
    );
    if (!row) return [];
    return state.structureNodes
      .filter((n) => n.parentId === row.id && n.type === "sitzvariante")
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [state.structureNodes, rows, form.rowLabel]);

  const kindMeta = KINDS.find((k) => k.id === form.moduleKind) ?? KINDS[0];
  const previewRaw =
    form.imageUrl ||
    pickDemoPartImage({
      name: form.name || form.coverLabel || form.moduleKind,
      moduleKind: form.moduleKind,
      partKind: kindMeta.partKind,
    });
  const previewSrc = form.imageUrl.startsWith("data:")
    ? form.imageUrl
    : withBasePath(previewRaw);

  function reset() {
    setForm({
      moduleKind: "bezug",
      rowLabel: rows[0]?.label ?? "",
      seatLabel: "",
      coverLabel: "Leder",
      partNumber: "",
      name: "",
      dueDate: "",
      side: "einzeln",
      imageUrl: "",
      pair: false,
      partNumberRight: "",
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
    if (!form.rowLabel.trim()) {
      setError("Sitzreihe wählen oder eingeben.");
      return;
    }
    if (!form.seatLabel.trim()) {
      setError("Sitzart wählen oder eingeben.");
      return;
    }
    if (!form.name.trim()) {
      setError("Beschreibung fehlt.");
      return;
    }
    if (!form.partNumber.trim()) {
      setError("Teilenummer fehlt.");
      return;
    }

    let structureNodeId: string;
    try {
      structureNodeId = resolveStructureForPart({
        projectId,
        rowLabel: form.rowLabel.trim(),
        seatLabel: form.seatLabel.trim(),
        moduleKind: form.moduleKind,
        coverLabel:
          form.moduleKind === "bezug" ? form.coverLabel.trim() || "Standard" : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Struktur konnte nicht angelegt werden.");
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
    const dueDate = form.dueDate.trim() || undefined;

    if (form.pair) {
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
      const patch: { imageUrl?: string; dueDate?: string } = {};
      if (form.imageUrl.trim()) patch.imageUrl = imageUrl;
      if (dueDate) patch.dueDate = dueDate;
      if (Object.keys(patch).length) {
        updatePart(pair.master.id, patch);
        updatePart(pair.mirror.id, patch);
      }
      openId = pair.master.id;
    } else {
      const created = addPart({
        projectId,
        structureNodeId,
        name: form.name.trim(),
        partNumber: form.partNumber.trim(),
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
        imageUrl,
        dueDate,
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
        drawings: [`${created.partNumber}.dxf`],
        photos: [],
        documents: [],
        bomItems: [],
        files: [],
        dxf: demoDxfAttachment(created),
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
      <Button onClick={() => { reset(); setOpen(true); }}>Neues Bauteil</Button>
      {open ? (
        <Modal title="Neues Bauteil" size="lg" onClose={() => setOpen(false)}>
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Art und Sitzreihe wählen – die Programmstruktur entsteht automatisch mit.
          </p>

          {error ? (
            <p className="mb-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="space-y-3">
              <Field label="Art / Kategorie">
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

              <Field label="Sitzreihe">
                <input
                  className={inputClass}
                  list={`rows-${projectId}`}
                  value={form.rowLabel}
                  onChange={(e) =>
                    setForm({ ...form, rowLabel: e.target.value, seatLabel: "" })
                  }
                  placeholder="z. B. 1. Reihe"
                />
                <datalist id={`rows-${projectId}`}>
                  {[...new Set([...rows.map((r) => r.label), ...ROW_PRESETS])].map(
                    (l) => (
                      <option key={l} value={l} />
                    ),
                  )}
                </datalist>
                {rows.length === 0 ? (
                  <p className="mt-1 text-xs text-[var(--ink-subtle)]">
                    Noch keine Reihe – einfach eingeben, z. B. „1. Reihe“.
                  </p>
                ) : null}
              </Field>

              <Field label="Sitzart">
                <input
                  className={inputClass}
                  list={`seats-${projectId}`}
                  value={form.seatLabel}
                  onChange={(e) => setForm({ ...form, seatLabel: e.target.value })}
                  placeholder="z. B. Sportsitz"
                />
                <datalist id={`seats-${projectId}`}>
                  {[...new Set([...seats.map((s) => s.label), ...SEAT_PRESETS])].map(
                    (l) => (
                      <option key={l} value={l} />
                    ),
                  )}
                </datalist>
              </Field>

              {form.moduleKind === "bezug" ? (
                <Field label="Bezugmaterial">
                  <input
                    className={inputClass}
                    list={`covers-${projectId}`}
                    value={form.coverLabel}
                    onChange={(e) => setForm({ ...form, coverLabel: e.target.value })}
                    placeholder="z. B. Alcantara"
                  />
                  <datalist id={`covers-${projectId}`}>
                    {COVER_PRESETS.map((l) => (
                      <option key={l} value={l} />
                    ))}
                  </datalist>
                </Field>
              ) : null}

              <Field label="Teilenummer">
                <input
                  className={inputClass}
                  value={form.partNumber}
                  onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                  placeholder="z. B. A990-1S-ALC-L"
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

              <Field label="Fertigstellung">
                <input
                  type="date"
                  className={inputClass}
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
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
                  checked={form.pair}
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
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex gap-2">
            <Button onClick={submit} disabled={busy}>
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
