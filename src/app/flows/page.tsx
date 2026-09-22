"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FlowCanvas } from "@/components/FlowCanvas";
import {
  Button,
  Field,
  PageHeader,
  Panel,
  StatusPill,
  inputClass,
} from "@/components/ui";
import { useStore } from "@/lib/store";

export default function FlowsPage() {
  const { state, startProcessFlow } = useStore();
  const flows = state.flows ?? [];
  const [selectedId, setSelectedId] = useState(flows[0]?.id ?? "");
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");
  const [partId, setPartId] = useState("");
  const flow = flows.find((f) => f.id === selectedId) ?? flows[0];

  const parts = useMemo(
    () =>
      state.parts
        .filter((p) => p.projectId === projectId)
        .sort((a, b) => a.partNumber.localeCompare(b.partNumber)),
    [state.parts, projectId],
  );

  function run() {
    if (!flow || !partId) return;
    const task = startProcessFlow({
      flowId: flow.id,
      projectId,
      partId,
    });
    if (task) window.location.href = `/tasks/${task.id}`;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Betriebssystem · Präsentation"
        title="Flow-Generator"
        description="Prozesse als Nodes: Aufträge, Agenten, Lager, Freigaben. Beim Abschluss startet der nächste Schritt automatisch."
        actions={
          <Link href="/platform">
            <Button variant="secondary">Plattform-Hub</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {flows.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedId(f.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              flow?.id === f.id
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] text-[var(--ink-muted)]"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {flow ? (
        <>
          <Panel className="mb-4" title={flow.name}>
            <p className="mb-3 text-sm text-[var(--ink-muted)]">{flow.description}</p>
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusPill tone={flow.active ? "ok" : "neutral"}>
                {flow.active ? "aktiv" : "inaktiv"}
              </StatusPill>
              <StatusPill tone="accent">
                Modus: {flow.mode === "auto" ? "Auto-Folgeauftrag" : "Vorschlag"}
              </StatusPill>
              <StatusPill>
                {flow.nodes.length} Nodes · {flow.edges.length} Verbindungen
              </StatusPill>
            </div>
            <p className="mb-3 text-xs text-[var(--ink-subtle)]">
              Nodes per Drag verschieben – ideal für Live-Demo.
            </p>
            <FlowCanvas flow={flow} />
          </Panel>

          <Panel title="Flow starten (Demo)">
            <p className="mb-3 text-sm text-[var(--ink-muted)]">
              Erzeugt den ersten Auftrags-Schritt inkl. Checkliste und Flow-Verknüpfung.
              Nach Erledigung folgt der nächste Node automatisch.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Programm">
                <select
                  className={inputClass}
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setPartId("");
                  }}
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.customer} · {p.code}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Teilenummer">
                <select
                  className={inputClass}
                  value={partId}
                  onChange={(e) => setPartId(e.target.value)}
                >
                  <option value="">— wählen —</option>
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.partNumber} · {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <Button onClick={run} disabled={!partId}>
                  Prozess starten
                </Button>
              </div>
            </div>
          </Panel>
        </>
      ) : (
        <p className="text-sm text-[var(--ink-subtle)]">Keine Flows geladen.</p>
      )}
    </div>
  );
}
