"use client";

import { useState } from "react";
import { Button, Field, Panel, inputClass } from "@/components/ui";
import { taskTypeLabel } from "@/lib/labels";
import { orderTypeDepartment } from "@/lib/orders";
import { useStore } from "@/lib/store";
import type { Part, PartKind } from "@/lib/types";

type Step = "form" | "cad";

const kindLabel: Record<string, string> = {
  profil: "Profil",
  befestigung: "Befestigung",
  sonstig: "Komponente",
  hauptteil: "Bauteil",
  schaum: "Schaum",
};

export function AddProfileForm({
  parent,
  defaultKind = "profil",
}: {
  parent: Part;
  /** Start mit Profil oder Komponente */
  defaultKind?: "profil" | "befestigung" | "sonstig";
}) {
  const { addPart, addRevision, addTask, state, currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({
    partNumber: "",
    name: "",
    componentRole:
      defaultKind === "profil" ? "OKR-Kurzschlussprofil" : "Komponente am Bezug",
    partKind: defaultKind as PartKind,
  });

  function openWith(kind: "profil" | "befestigung" | "sonstig") {
    setForm({
      partNumber: "",
      name: "",
      componentRole:
        kind === "profil" ? "OKR-Kurzschlussprofil" : "Komponente am Bezug",
      partKind: kind,
    });
    setStep("form");
    setOpen(true);
  }

  function reset() {
    setOpen(false);
    setStep("form");
    setForm({
      partNumber: "",
      name: "",
      componentRole: "OKR-Kurzschlussprofil",
      partKind: "profil",
    });
  }

  function goToCadQuestion() {
    if (!form.partNumber.trim() || !form.name.trim()) return;
    setStep("cad");
  }

  const thingLabel = kindLabel[form.partKind] ?? "Komponente";

  function createItem(withCadOrder: boolean) {
    const tn = form.partNumber.trim();
    const isProfil = form.partKind === "profil";
    const created = addPart({
      partNumber: tn,
      name: form.name.trim(),
      projectId: parent.projectId,
      structureNodeId: parent.structureNodeId,
      side: "einzeln",
      moduleKind: isProfil ? "profil" : parent.moduleKind === "bezug" ? "profil" : "profil",
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
      reason: `${thingLabel} am Bezug ${parent.partNumber} angelegt`,
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
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        progress: 0,
        description: `Erstzeichnung für ${thingLabel} ${created.name} (${created.partNumber}) am Bezug ${parent.partNumber}. Eingestellt von ${currentUser?.name ?? "User"}. Bitte CAD-Zeichner zuweisen.`,
      });
      reset();
      window.location.href = `/tasks/${task.id}`;
      return;
    }

    reset();
    window.location.href = `/parts/${created.id}`;
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => openWith("profil")}>
          Profil hinzufügen
        </Button>
        <Button variant="secondary" onClick={() => openWith("sonstig")}>
          Komponente hinzufügen
        </Button>
        <Button variant="ghost" onClick={() => openWith("befestigung")}>
          Befestigung / Clip
        </Button>
      </div>
    );
  }

  if (step === "cad") {
    return (
      <Panel title="CAD-Zeichnung beauftragen?" className="mb-4">
        <p className="mb-1 text-sm font-medium text-[var(--ink)]">
          {thingLabel}: {form.partNumber} · {form.name}
        </p>
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          Soll die CAD-Abteilung das zeichnen? Auftrag geht an{" "}
          <strong>CAD / Zeichnung</strong> (Zuweisung offen).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => createItem(true)}>Ja, CAD beauftragen</Button>
          <Button variant="secondary" onClick={() => createItem(false)}>
            Nein, nur anlegen
          </Button>
          <Button variant="ghost" onClick={() => setStep("form")}>
            Zurück
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={`${thingLabel} am Bezug anlegen`} className="mb-4">
      <p className="mb-3 text-sm text-[var(--ink-muted)]">
        {form.partKind === "profil"
          ? "Profile (z. B. OKR) haben eigene Teilenummer und Zeichnung – am Bezug angenäht zur Befestigung am Schaum."
          : "Komponenten am Bezug (Clips, Befestigungen, sonstige Teile) mit eigener Teilenummer."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Teilenummer">
          <input
            className={inputClass}
            value={form.partNumber}
            onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
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
                : "Bezeichnung der Komponente"
            }
          />
        </Field>
        <Field label="Rolle am Bezug">
          <input
            className={inputClass}
            value={form.componentRole}
            onChange={(e) => setForm({ ...form, componentRole: e.target.value })}
          />
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={goToCadQuestion}>Weiter</Button>
        <Button variant="ghost" onClick={reset}>
          Abbrechen
        </Button>
      </div>
    </Panel>
  );
}
