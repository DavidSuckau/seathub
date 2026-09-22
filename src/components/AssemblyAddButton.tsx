"use client";

import { useMemo, useState } from "react";
import { Button, Field, Modal, inputClass } from "@/components/ui";
import { getUsedOnPartIds } from "@/lib/components";
import { taskTypeLabel } from "@/lib/labels";
import { orderTypeDepartment } from "@/lib/orders";
import { useStore } from "@/lib/store";
import type { Part, PartKind } from "@/lib/types";
import { navigate } from "@/lib/nav";

type Mode =
  | null
  | "menu"
  | "neu"
  | "cad"
  | "link";

const kindLabel: Record<string, string> = {
  profil: "Profil",
  befestigung: "Befestigung",
  sonstig: "Komponente",
};

/**
 * Ein kleiner „+“-Button statt vieler großer CTAs.
 * Neu anlegen / verknüpfen läuft in Modals (SeatHub UX).
 */
export function AssemblyAddButton({ parent }: { parent: Part }) {
  const { addPart, addRevision, addTask, state, currentUser, linkComponentToAssembly } =
    useStore();
  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState({
    partNumber: "",
    name: "",
    componentRole: "OKR-Kurzschlussprofil",
    partKind: "profil" as PartKind,
  });
  const [linkId, setLinkId] = useState("");

  const linkCandidates = useMemo(() => {
    return state.parts.filter((p) => {
      if (p.projectId !== parent.projectId) return false;
      if (p.partKind !== "profil" && p.partKind !== "befestigung") return false;
      return !getUsedOnPartIds(p).includes(parent.id);
    });
  }, [state.parts, parent]);

  function close() {
    setMode(null);
    setLinkId("");
    setForm({
      partNumber: "",
      name: "",
      componentRole: "OKR-Kurzschlussprofil",
      partKind: "profil",
    });
  }

  function startNeu(kind: "profil" | "befestigung" | "sonstig") {
    setForm({
      partNumber: "",
      name: "",
      componentRole:
        kind === "profil"
          ? "OKR-Kurzschlussprofil"
          : kind === "befestigung"
            ? "Befestigung / Clip"
            : "Komponente am Bezug",
      partKind: kind,
    });
    setMode("neu");
  }

  function goToCad() {
    if (!form.partNumber.trim() || !form.name.trim()) return;
    setMode("cad");
  }

  function createItem(withCadOrder: boolean) {
    const tn = form.partNumber.trim();
    const isProfil = form.partKind === "profil";
    const thing = kindLabel[form.partKind] ?? "Komponente";
    const created = addPart({
      partNumber: tn,
      name: form.name.trim(),
      projectId: parent.projectId,
      structureNodeId: parent.structureNodeId,
      side: "einzeln",
      moduleKind: isProfil
        ? "profil"
        : parent.moduleKind === "bezug"
          ? "profil"
          : "profil",
      partKind: form.partKind,
      parentPartId: parent.id,
      usedOnPartIds: [parent.id],
      componentRole: form.componentRole.trim() || undefined,
      engineerUserId: parent.engineerUserId ?? state.currentUserId,
      coverDeveloperUserId: parent.coverDeveloperUserId,
      currentRevision: "01",
      developmentRole: "eigenstaendig",
    });
    addRevision({
      partId: created.id,
      revision: "01",
      title: withCadOrder ? "Erstzeichnung – CAD beauftragt" : "Erststand angelegt",
      date: new Date().toISOString().slice(0, 10),
      createdByUserId: state.currentUserId,
      userType: "intern",
      reason: `${thing} am Bezug ${parent.partNumber} angelegt`,
      status: "in_entwicklung",
      drawings: [],
      photos: [],
      documents: [],
      bomItems: [],
      files: [],
    });

    if (withCadOrder) {
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
      navigate(`/tasks/${task.id}`);
      return;
    }

    close();
    navigate(`/parts/${created.id}`);
  }

  const thingLabel = kindLabel[form.partKind] ?? "Komponente";

  return (
    <>
      <button
        type="button"
        title="Hinzufügen"
        aria-label="Profil oder Komponente hinzufügen"
        onClick={() => setMode("menu")}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-lg font-medium leading-none text-[var(--ink-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        +
      </button>

      {mode === "menu" ? (
        <Modal title="Hinzufügen" onClose={close} size="md">
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Was möchtest du am Bezug anlegen oder verknüpfen?
          </p>
          <ul className="space-y-2">
            {(
              [
                {
                  id: "profil" as const,
                  label: "Neues Profil",
                  hint: "OKR o. ä. – eigene TN + Stände",
                },
                {
                  id: "sonstig" as const,
                  label: "Neue Komponente",
                  hint: "Sonstiges Teil am Bezug",
                },
                {
                  id: "befestigung" as const,
                  label: "Befestigung / Clip",
                  hint: "Clips, Halter, Befestigungen",
                },
              ] as const
            ).map((opt) => (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => startNeu(opt.id)}
                  className="flex w-full flex-col rounded-[var(--radius)] border border-[var(--line)] px-4 py-3 text-left transition hover:border-[var(--accent)]"
                >
                  <span className="font-medium text-[var(--ink)]">{opt.label}</span>
                  <span className="text-xs text-[var(--ink-muted)]">{opt.hint}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setMode("link")}
                className="flex w-full flex-col rounded-[var(--radius)] border border-[var(--line)] px-4 py-3 text-left transition hover:border-[var(--accent)]"
              >
                <span className="font-medium text-[var(--ink)]">
                  Bestehendes Profil verknüpfen
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  Geteilte Verwendung an diesem Bezug
                </span>
              </button>
            </li>
          </ul>
        </Modal>
      ) : null}

      {mode === "neu" ? (
        <Modal title={`${thingLabel} anlegen`} onClose={close} size="lg">
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            {form.partKind === "profil"
              ? "Profile haben eigene Teilenummer und Zeichnung."
              : "Komponente mit eigener Teilenummer am Bezug."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Teilenummer">
              <input
                className={inputClass}
                value={form.partNumber}
                onChange={(e) =>
                  setForm({ ...form, partNumber: e.target.value })
                }
                placeholder="z. B. A990-ALC-L-P05"
              />
            </Field>
            <Field label="Art">
              <select
                className={inputClass}
                value={form.partKind}
                onChange={(e) => {
                  const kind = e.target.value as PartKind;
                  setForm({
                    ...form,
                    partKind: kind,
                    componentRole:
                      kind === "profil"
                        ? "OKR-Kurzschlussprofil"
                        : kind === "befestigung"
                          ? "Befestigung / Clip"
                          : "Komponente am Bezug",
                  });
                }}
              >
                <option value="profil">Profil (OKR o. ä.)</option>
                <option value="befestigung">Befestigung / Clip</option>
                <option value="sonstig">Sonstige Komponente</option>
              </select>
            </Field>
            <Field label="Bezeichnung">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={
                  form.partKind === "profil"
                    ? "OKR-Kurzschlussprofil …"
                    : "Bezeichnung"
                }
              />
            </Field>
            <Field label="Rolle am Bezug">
              <input
                className={inputClass}
                value={form.componentRole}
                onChange={(e) =>
                  setForm({ ...form, componentRole: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={goToCad}>Weiter</Button>
            <Button variant="secondary" onClick={() => setMode("menu")}>
              Zurück
            </Button>
            <Button variant="ghost" onClick={close}>
              Abbrechen
            </Button>
          </div>
        </Modal>
      ) : null}

      {mode === "cad" ? (
        <Modal title="CAD-Zeichnung beauftragen?" onClose={close} size="md">
          <p className="mb-1 text-sm font-medium text-[var(--ink)]">
            {thingLabel}: {form.partNumber} · {form.name}
          </p>
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Soll die CAD-Abteilung das zeichnen? Auftrag geht an CAD (Zuweisung
            offen).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => createItem(true)}>Ja, CAD beauftragen</Button>
            <Button variant="secondary" onClick={() => createItem(false)}>
              Nein, nur anlegen
            </Button>
            <Button variant="ghost" onClick={() => setMode("neu")}>
              Zurück
            </Button>
          </div>
        </Modal>
      ) : null}

      {mode === "link" ? (
        <Modal title="Bestehendes Profil verknüpfen" onClose={close} size="md">
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            Gleiches Profil für mehrere Bezüge. Eine Änderung gilt für alle
            verknüpften Bezüge.
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
                  {c.partNumber} · {c.name} (Stand {c.currentRevision})
                </option>
              ))}
            </select>
          </Field>
          {linkCandidates.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--ink-subtle)]">
              Keine weiteren Profile im Programm verfügbar.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
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
            <Button variant="secondary" onClick={() => setMode("menu")}>
              Zurück
            </Button>
            <Button variant="ghost" onClick={close}>
              Abbrechen
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

/** @deprecated Alias – nutzt denselben +/Modal-Flow */
export function AddProfileForm({
  parent,
}: {
  parent: Part;
  defaultKind?: "profil" | "befestigung" | "sonstig";
}) {
  return <AssemblyAddButton parent={parent} />;
}
