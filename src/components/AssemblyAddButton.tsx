"use client";

import { useMemo, useRef, useState } from "react";
import { readImageFile } from "@/components/LopPhotoGallery";
import { Button, Field, Modal, StatusPill, inputClass } from "@/components/ui";
import { getUsedOnPartIds } from "@/lib/components";
import { taskTypeLabel } from "@/lib/labels";
import { withBasePath } from "@/lib/nav";
import { demoDxfAttachment } from "@/lib/dxf-demo";
import { suggestedPlannedHours } from "@/lib/capacity";
import { orderTypeDepartment } from "@/lib/orders";
import { pickDemoPartImage } from "@/lib/part-images";
import { useStore } from "@/lib/store";
import type { Part, PartKind } from "@/lib/types";

const kindLabel: Record<string, string> = {
  profil: "Profil",
  befestigung: "Befestigung",
  sonstig: "Komponente",
};

/**
 * Am Bezug: Profil/Komponente anlegen oder bestehendes verknüpfen.
 * CAD wird nur eingestellt – Zeichner bekommt den Auftrag, du bleibst am Bezug.
 */
export function AssemblyAddButton({
  parent,
  onAdded,
}: {
  parent: Part;
  onAdded?: (info: { partId: string; cadOrdered: boolean }) => void;
}) {
  const { addPart, addRevision, addTask, state, currentUser, linkComponentToAssembly } =
    useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"neu" | "link">("neu");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [withCad, setWithCad] = useState(true);
  const [linkId, setLinkId] = useState("");
  const [form, setForm] = useState({
    partNumber: "",
    name: "",
    partKind: "profil" as PartKind,
    dueDate: "",
    imageUrl: "",
  });

  const linkCandidates = useMemo(() => {
    return state.parts.filter((p) => {
      if (p.projectId !== parent.projectId) return false;
      if (p.partKind !== "profil" && p.partKind !== "befestigung") return false;
      return !getUsedOnPartIds(p).includes(parent.id);
    });
  }, [state.parts, parent]);

  function close() {
    setOpen(false);
    setMode("neu");
    setLinkId("");
    setError(null);
    setWithCad(true);
    setForm({
      partNumber: "",
      name: "",
      partKind: "profil",
      dueDate: "",
      imageUrl: "",
    });
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

  function createItem() {
    setError(null);
    if (!form.partNumber.trim() || !form.name.trim()) {
      setError("Nummer und Beschreibung sind Pflicht.");
      return;
    }
    const thing = kindLabel[form.partKind] ?? "Komponente";
    const imageUrl =
      form.imageUrl.trim() ||
      pickDemoPartImage({
        name: form.name.trim(),
        partKind: form.partKind,
        moduleKind: "profil",
      });

    const created = addPart({
      partNumber: form.partNumber.trim(),
      name: form.name.trim(),
      projectId: parent.projectId,
      structureNodeId: parent.structureNodeId,
      side: "einzeln",
      moduleKind: "profil",
      partKind: form.partKind,
      parentPartId: parent.id,
      usedOnPartIds: [parent.id],
      componentRole: thing,
      engineerUserId: parent.engineerUserId ?? state.currentUserId,
      coverDeveloperUserId: parent.coverDeveloperUserId,
      currentRevision: "01",
      developmentRole: "eigenstaendig",
      imageUrl,
      dueDate: form.dueDate.trim() || undefined,
    });
    addRevision({
      partId: created.id,
      revision: "01",
      title: withCad ? "Erstzeichnung – CAD beauftragt" : "Erststand angelegt",
      date: new Date().toISOString().slice(0, 10),
      createdByUserId: state.currentUserId,
      userType: "intern",
      reason: `${thing} am Bezug ${parent.partNumber} angelegt`,
      status: "in_entwicklung",
      drawings: [`${created.partNumber}.dxf`],
      photos: [],
      documents: [],
      bomItems: [],
      files: [],
      dxf: demoDxfAttachment(created),
    });

    if (withCad) {
      addTask({
        title: `${taskTypeLabel.cad} · ${created.partNumber} · Stand 01`,
        type: "cad",
        status: "offen",
        projectId: parent.projectId,
        partId: created.id,
        revisionStand: "01",
        departmentId: orderTypeDepartment.cad,
        createdByUserId: state.currentUserId,
        needsAssignment: true,
        priority: "hoch",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        plannedHours: suggestedPlannedHours("cad"),
        progress: 0,
        description: `Erstzeichnung für ${thing} ${created.name} (${created.partNumber}) am Bezug ${parent.partNumber}. Eingestellt von ${currentUser?.name ?? "User"}.`,
      });
    }

    close();
    onAdded?.({ partId: created.id, cadOrdered: withCad });
    // Am Bezug bleiben – CAD-Auftrag läuft still für den Zeichner
  }

  const previewRaw =
    form.imageUrl ||
    pickDemoPartImage({
      name: form.name || form.partKind,
      partKind: form.partKind,
      moduleKind: "profil",
    });
  const preview = form.imageUrl.startsWith("data:")
    ? form.imageUrl
    : withBasePath(previewRaw);

  const primaryLabel = withCad
    ? `${kindLabel[form.partKind] ?? "Profil"} anlegen · CAD beauftragen`
    : `${kindLabel[form.partKind] ?? "Profil"} anlegen`;

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Profil
      </Button>

      {open ? (
        <Modal title="Profil am Bezug" onClose={close} size="lg">
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Neues Profil anlegen oder ein bestehendes an{" "}
            <strong className="text-[var(--ink)]">{parent.partNumber}</strong>{" "}
            hängen.
          </p>

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("neu")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === "neu"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)] text-[var(--ink-muted)]"
              }`}
            >
              Neu
            </button>
            <button
              type="button"
              onClick={() => setMode("link")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === "link"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)] text-[var(--ink-muted)]"
              }`}
            >
              Bestehendes verknüpfen
            </button>
          </div>

          {error ? (
            <p className="mb-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          {mode === "neu" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <div className="space-y-3">
                  <Field label="Art">
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          ["profil", "Profil"],
                          ["befestigung", "Befestigung"],
                          ["sonstig", "Komponente"],
                        ] as const
                      ).map(([id, lab]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setForm({ ...form, partKind: id })}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            form.partKind === id
                              ? "bg-[var(--accent)] text-white"
                              : "border border-[var(--line)] text-[var(--ink-muted)]"
                          }`}
                        >
                          {lab}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Teilenummer">
                    <input
                      className={inputClass}
                      value={form.partNumber}
                      onChange={(e) =>
                        setForm({ ...form, partNumber: e.target.value })
                      }
                      placeholder="z. B. A990-ALC-L-P05"
                      autoFocus
                    />
                  </Field>
                  <Field label="Beschreibung">
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="z. B. OKR-Kurzschlussprofil Sitzseite"
                    />
                  </Field>
                  <Field label="Fertigstellung (optional)">
                    <input
                      type="date"
                      className={inputClass}
                      value={form.dueDate}
                      onChange={(e) =>
                        setForm({ ...form, dueDate: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium">Bild</p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="relative block aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] border border-dashed border-[var(--line-strong)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-[#10151a]/65 py-1 text-center text-[11px] text-white">
                      {form.imageUrl ? "Ersetzen" : "Foto"}
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

              <div className="mt-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] px-3 py-3">
                <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={withCad}
                    onChange={(e) => setWithCad(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium text-[var(--ink)]">
                      Zeichnung an CAD schicken
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
                      Erzeugt einen offenen CAD-Auftrag für den Zeichner. Du bleibst
                      hier am Bezug – der Auftrag öffnet sich nicht.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
                <Button onClick={createItem} disabled={busy}>
                  {primaryLabel}
                </Button>
                <Button variant="ghost" onClick={close}>
                  Abbrechen
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-[var(--ink-muted)]">
                Bestehendes Profil an diesen Bezug hängen (geteilt – eine Änderung
                wirkt überall).
              </p>
              <Field label="Profil">
                <select
                  className={inputClass}
                  value={linkId}
                  onChange={(e) => setLinkId(e.target.value)}
                >
                  <option value="">— wählen —</option>
                  {linkCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.partNumber} · {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              {linkCandidates.length === 0 ? (
                <p className="mt-2 text-xs text-[var(--ink-subtle)]">
                  Keine weiteren Profile in diesem Programm – unter „Neu“ anlegen.
                </p>
              ) : null}
              <div className="mt-4 flex gap-2">
                <Button
                  disabled={!linkId}
                  onClick={() => {
                    if (!linkId) return;
                    linkComponentToAssembly(linkId, parent.id);
                    close();
                    onAdded?.({ partId: linkId, cadOrdered: false });
                  }}
                >
                  Verknüpfen
                </Button>
                <Button variant="ghost" onClick={close}>
                  Abbrechen
                </Button>
              </div>
            </>
          )}
        </Modal>
      ) : null}
    </>
  );
}

/** Offener CAD-Auftrag zu diesem Bauteil? */
export function hasOpenCadOrder(
  tasks: { partId?: string; type: string; status: string }[],
  partId: string,
): boolean {
  const done = new Set(["abgeschlossen", "erledigt", "gestoppt"]);
  return tasks.some(
    (t) =>
      t.partId === partId && t.type === "cad" && !done.has(t.status),
  );
}

export function CadOrderedPill() {
  return <StatusPill tone="accent">CAD beim Zeichner</StatusPill>;
}

/** @deprecated Alias */
export function AddProfileForm({ parent }: { parent: Part }) {
  return <AssemblyAddButton parent={parent} />;
}
