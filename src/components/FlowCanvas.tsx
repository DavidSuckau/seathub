"use client";

import { useRef, useState } from "react";
import { StatusPill } from "@/components/ui";
import { flowNodeKindLabel } from "@/lib/platform";
import { useStore } from "@/lib/store";
import type { FlowNode, ProcessFlow } from "@/lib/types";

const kindTone: Record<string, "accent" | "ok" | "watch" | "warn" | "neutral"> = {
  start: "ok",
  ende: "neutral",
  auftrag: "accent",
  agent: "watch",
  lager: "warn",
  freigabe: "ok",
  abteilung: "neutral",
  standort: "neutral",
};

export function FlowCanvas({
  flow,
  selectedNodeId,
  onSelectNode,
  connectFromId,
  connectMode,
}: {
  flow: ProcessFlow;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  connectFromId?: string | null;
  connectMode?: boolean;
}) {
  const { moveFlowNode, addFlowEdge } = useStore();
  const [drag, setDrag] = useState<{
    nodeId: string;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  function onPointerDown(e: React.PointerEvent, node: FlowNode) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({
      nodeId: node.id,
      ox: e.clientX - node.x,
      oy: e.clientY - node.y,
      moved: false,
    });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const x = Math.max(0, e.clientX - drag.ox);
    const y = Math.max(0, e.clientY - drag.oy);
    if (!drag.moved) {
      setDrag({ ...drag, moved: true });
    }
    moveFlowNode(flow.id, drag.nodeId, x, y);
  }

  function onPointerUp(e: React.PointerEvent, node: FlowNode) {
    const wasDrag = drag;
    setDrag(null);
    if (!wasDrag || wasDrag.nodeId !== node.id) return;
    if (wasDrag.moved) return;
    if (connectMode && connectFromId) {
      if (connectFromId !== node.id) {
        addFlowEdge(flow.id, connectFromId, node.id);
      }
      onSelectNode?.(node.id);
      return;
    }
    onSelectNode?.(node.id);
  }

  const maxX = Math.max(800, ...flow.nodes.map((n) => n.x + 200));
  const maxY = Math.max(360, ...flow.nodes.map((n) => n.y + 120));

  return (
    <div
      ref={boardRef}
      className="relative overflow-auto rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--bg)]"
      style={{ minHeight: 420 }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setDrag(null)}
    >
      <svg
        className="pointer-events-none absolute left-0 top-0"
        width={maxX}
        height={maxY}
        aria-hidden
      >
        {flow.edges.map((e) => {
          const from = flow.nodes.find((n) => n.id === e.from);
          const to = flow.nodes.find((n) => n.id === e.to);
          if (!from || !to) return null;
          const x1 = from.x + 80;
          const y1 = from.y + 36;
          const x2 = to.x + 20;
          const y2 = to.y + 36;
          const mx = (x1 + x2) / 2;
          return (
            <path
              key={e.id}
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="var(--line-strong)"
              strokeWidth={2}
              markerEnd="url(#arrow)"
            />
          );
        })}
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--ink-subtle)" />
          </marker>
        </defs>
      </svg>

      <div className="relative" style={{ width: maxX, height: maxY }}>
        {flow.nodes.map((node) => {
          const selected = selectedNodeId === node.id;
          const connectFrom = connectFromId === node.id;
          return (
            <button
              key={node.id}
              type="button"
              onPointerDown={(e) => onPointerDown(e, node)}
              onPointerUp={(e) => onPointerUp(e, node)}
              className={`absolute w-[160px] cursor-grab rounded-[var(--radius)] border bg-[var(--surface)] px-3 py-2.5 text-left shadow-[var(--shadow)] active:cursor-grabbing ${
                selected || connectFrom
                  ? "border-[var(--accent)] z-10 ring-2 ring-[var(--accent)]/30"
                  : drag?.nodeId === node.id
                    ? "border-[var(--accent)] z-10"
                    : "border-[var(--line)]"
              }`}
              style={{ left: node.x, top: node.y }}
            >
              <StatusPill tone={kindTone[node.kind] ?? "neutral"}>
                {flowNodeKindLabel[node.kind]}
              </StatusPill>
              <p className="mt-1.5 text-sm font-semibold text-[var(--ink)]">
                {node.label}
              </p>
              {node.taskType ? (
                <p className="mt-0.5 text-[11px] text-[var(--ink-subtle)]">
                  {node.taskType}
                </p>
              ) : null}
              {(node.checklistLabels?.length ?? 0) > 0 ? (
                <p className="mt-1 text-[10px] text-[var(--accent)]">
                  {node.checklistLabels!.length} Checkpunkte
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
