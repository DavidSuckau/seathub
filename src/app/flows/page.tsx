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
import { navigateToTask } from "@/lib/nav";
import { taskTypeLabel } from "@/lib/labels";
import { createOrderTileTypes, orderTypeDepartment } from "@/lib/orders";
import { checklistForTaskType, flowNodeKindLabel } from "@/lib/platform";
import { useStore } from "@/lib/store";
import type { FlowNodeKind, TaskType } from "@/lib/types";

const ADD_KINDS: FlowNodeKind[] = [
  "auftrag",
  "freigabe",
  "agent",
  "lager",
  "standort",
  "ende",
];

export default function FlowsPage() {
  const {
    state,
    startProcessFlow,
    updateFlow,
    addFlowNode,
    updateFlowNode,
    removeFlowNode,
    removeFlowEdge,
    duplicateFlow,
  } = useStore();
  const flows = state.flows ?? [];
  const [selectedId, setSelectedId] = useState(flows[0]?.id ?? "");
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");
  const [partId, setPartId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);

  const flow = flows.find((f) => f.id === selectedId) ?? flows[0];
  const selectedNode = flow?.nodes.find((n) => n.id === selectedNodeId);

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
    if (task) navigateToTask(task.id);
  }

  function onSelectNode(nodeId: string) {
    if (connectMode) {
      if (!connectFromId) {
        setConnectFromId(nodeId);
        setSelectedNodeId(nodeId);
        return;
      }
      setConnectFromId(null);
      setConnectMode(false);
      setSelectedNodeId(nodeId);
      return;
    }
    setSelectedNodeId(nodeId);
  }

  function addNode(kind: FlowNodeKind) {
    if (!flow) return;
    const node = addFlowNode(flow.id, kind);
    if (node) setSelectedNodeId(node.id);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Betriebssystem · Präsentation"
        title="Flow-Generator"
        description="Prozesse einstellen: Nodes, Verbindungen, Modus. Beim Abschluss folgt Auto-Schritt oder Vorschlag zur Bestätigung."
        actions={
          <Link href="/studio">
            <Button variant="secondary">Studio-Hub</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {flows.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setSelectedId(f.id);
              setSelectedNodeId(null);
              setConnectMode(false);
              setConnectFromId(null);
            }}
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
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updateFlow(flow.id, { active: !flow.active })
                }
              >
                <StatusPill tone={flow.active ? "ok" : "neutral"}>
                  {flow.active ? "aktiv" : "inaktiv"}
                </StatusPill>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateFlow(flow.id, {
                    mode: flow.mode === "auto" ? "vorschlagen" : "auto",
                  })
                }
              >
                <StatusPill tone="accent">
                  Modus:{" "}
                  {flow.mode === "auto"
                    ? "Auto-Folgeauftrag"
                    : "Vorschlag (Mensch)"}
                </StatusPill>
              </button>
              <StatusPill>
                {flow.nodes.length} Nodes · {flow.edges.length} Verbindungen
              </StatusPill>
              <Button
                variant="secondary"
                onClick={() => {
                  const copy = duplicateFlow(flow.id);
                  if (copy) setSelectedId(copy.id);
                }}
              >
                Duplizieren
              </Button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {ADD_KINDS.map((k) => (
                <Button key={k} variant="ghost" onClick={() => addNode(k)}>
                  + {flowNodeKindLabel[k]}
                </Button>
              ))}
              <Button
                variant={connectMode ? "primary" : "secondary"}
                onClick={() => {
                  setConnectMode((v) => !v);
                  setConnectFromId(null);
                }}
              >
                {connectMode
                  ? connectFromId
                    ? "Ziel-Node anklicken…"
                    : "Verbinden: Start wählen"
                  : "Verbindung ziehen"}
              </Button>
            </div>
            {connectMode ? (
              <p className="mb-2 text-xs text-[var(--accent)]">
                Klick 1: Ausgang · Klick 2: Ziel. Kante wird gespeichert.
              </p>
            ) : (
              <p className="mb-2 text-xs text-[var(--ink-subtle)]">
                Node anklicken = Eigenschaften · ziehen = Position.
              </p>
            )}

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <FlowCanvas
                flow={flow}
                selectedNodeId={selectedNodeId}
                onSelectNode={onSelectNode}
                connectMode={connectMode}
                connectFromId={connectFromId}
              />
              <div className="space-y-3">
                <Panel title="Node-Eigenschaften">
                  {selectedNode ? (
                    <div className="space-y-3">
                      <Field label="Label">
                        <input
                          className={inputClass}
                          value={selectedNode.label}
                          onChange={(e) =>
                            updateFlowNode(flow.id, selectedNode.id, {
                              label: e.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field label="Art">
                        <select
                          className={inputClass}
                          value={selectedNode.kind}
                          disabled={selectedNode.kind === "start"}
                          onChange={(e) =>
                            updateFlowNode(flow.id, selectedNode.id, {
                              kind: e.target.value as FlowNodeKind,
                            })
                          }
                        >
                          {(
                            Object.keys(flowNodeKindLabel) as FlowNodeKind[]
                          ).map((k) => (
                            <option key={k} value={k}>
                              {flowNodeKindLabel[k]}
                            </option>
                          ))}
                        </select>
                      </Field>
                      {selectedNode.kind === "auftrag" ||
                      selectedNode.kind === "freigabe" ? (
                        <Field label="Auftragstyp">
                          <select
                            className={inputClass}
                            value={selectedNode.taskType ?? "pruefung"}
                            onChange={(e) => {
                              const taskType = e.target.value as TaskType;
                              updateFlowNode(flow.id, selectedNode.id, {
                                taskType,
                                departmentId: orderTypeDepartment[taskType],
                                checklistLabels:
                                  checklistForTaskType[taskType] ??
                                  selectedNode.checklistLabels,
                              });
                            }}
                          >
                            {createOrderTileTypes.map((t) => (
                              <option key={t} value={t}>
                                {taskTypeLabel[t]}
                              </option>
                            ))}
                          </select>
                        </Field>
                      ) : null}
                      <Field label="Checkliste (eine Zeile = Punkt)">
                        <textarea
                          className={`${inputClass} min-h-[100px]`}
                          value={(selectedNode.checklistLabels ?? []).join(
                            "\n",
                          )}
                          onChange={(e) =>
                            updateFlowNode(flow.id, selectedNode.id, {
                              checklistLabels: e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </Field>
                      <Field label="Agent-ID (optional)">
                        <select
                          className={inputClass}
                          value={selectedNode.agentId ?? ""}
                          onChange={(e) =>
                            updateFlowNode(flow.id, selectedNode.id, {
                              agentId: e.target.value || undefined,
                            })
                          }
                        >
                          <option value="">—</option>
                          {(state.agents ?? []).map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      {selectedNode.kind !== "start" ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            removeFlowNode(flow.id, selectedNode.id);
                            setSelectedNodeId(null);
                          }}
                        >
                          Node löschen
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--ink-muted)]">
                      Node auf der Fläche wählen.
                    </p>
                  )}
                </Panel>
                <Panel title="Verbindungen">
                  <ul className="max-h-40 space-y-1 overflow-auto text-xs">
                    {flow.edges.map((e) => {
                      const from = flow.nodes.find((n) => n.id === e.from);
                      const to = flow.nodes.find((n) => n.id === e.to);
                      return (
                        <li
                          key={e.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="text-[var(--ink-muted)]">
                            {from?.label ?? "?"} → {to?.label ?? "?"}
                          </span>
                          <button
                            type="button"
                            className="text-[var(--danger)]"
                            onClick={() => removeFlowEdge(flow.id, e.id)}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              </div>
            </div>
          </Panel>

          <Panel title="Flow starten (Demo)">
            <p className="mb-3 text-sm text-[var(--ink-muted)]">
              Erzeugt den ersten Auftrags-/Freigabe-Schritt inkl. Checkliste.
              Danach: Auto-Folge oder Vorschlag je nach Modus.
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
                <Button onClick={run} disabled={!partId || !flow.active}>
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
