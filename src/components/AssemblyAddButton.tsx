"use client";

import { useMemo, useRef, useState } from "react";
import { readImageFile } from "@/components/LopPhotoGallery";
import { Button, Field, Modal, inputClass } from "@/components/ui";
import { getUsedOnPartIds } from "@/lib/components";
import { taskTypeLabel } from "@/lib/labels";
import { navigateToPart, navigateToTask, withBasePath } from "@/lib/nav";
import { demoDxfAttachment } from "@/lib/dxf-demo";
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
 * Ein „+“ am Bezug: neues Profil/Komponente in einem Schritt.
 */
export function AssemblyAddButton({ parent }: { parent: Part }) {
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
    setForm({ partNumber: "", name: "", partKind: "profil", imageUrl: "" });
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
      const task = addTask({
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
        progress: 0,
        description: `Erstzeichnung für ${thing} ${created.name} (${created.partNumber}) am Bezug ${parent.partNumber}. Eingestellt von ${currentUser?.name ?? "User"}.`,
      });
      close();
      navigateToTask(task.id);
      return;
    }

    close();
    navigateToPart(created.id);
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

  return (
    <>
      <button
        type="button"
        title="Hinzufügen"
        aria-label="Profil oder Komponente hinzufügen"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-lg font-medium leading-none text-[var(--ink-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        +
      </button>

      {open ? (
        <Modal title="Am Bezug hinzufügen" onClose={close} size="lg">
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("neu")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === "neu"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)]"
              }`}
            >
              Neu anlegen
            </button>
            <button
              type="button"
              onClick={() => setMode("link")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === "link"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)]"
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
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="z. B. OKR-Kurzschlussprofil Sitzseite"
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
                    <input
                      type="checkbox"
                      checked={withCad}
                      onChange={(e) => setWithCad(e.target.checked)}
                    />
                    CAD-Zeichnung gleich beauftragen
                  </label>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium">Bild</p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="relative block aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] border border-dashed border-[var(--line-strong)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="" className="h-full w-full object-cover" />
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
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={createItem} disabled={busy}>
                  Anlegen
                </Button>
                <Button variant="ghost" onClick={close}>
                  Abbrechen
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-[var(--ink-muted)]">
                Bestehendes Profil an diesen Bezug hängen (geteilt).
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
              <div className="mt-4 flex gap-2">
                <Button
                  disabled={!linkId}
                  onClick={() => {
                    if (!linkId) return;
                    linkComponentToAssembly(linkId, parent.id);
                    close();
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

/** @deprecated Alias */
export function AddProfileForm({ parent }: { parent: Part }) {
  return <AssemblyAddButton parent={parent} />;
}
