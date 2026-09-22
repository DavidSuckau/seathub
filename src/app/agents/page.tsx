"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Button,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/ui";
import {
  agentKindLabel,
  suggestAssignees,
} from "@/lib/platform";
import { formatDateTime, taskTypeLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { TaskType } from "@/lib/types";

const severityTone: Record<string, "ok" | "warn" | "danger" | "accent" | "neutral"> = {
  ok: "ok",
  warn: "warn",
  kritisch: "danger",
  info: "accent",
};

export default function AgentsPage() {
  const { state, pushAgentInsight } = useStore();
  const agents = state.agents ?? [];
  const insights = state.agentInsights ?? [];
  const [demoType, setDemoType] = useState<TaskType>("naehauftrag");

  const suggestions = useMemo(
    () => suggestAssignees(state.users, demoType, 3),
    [state.users, demoType],
  );

  function simulateLager() {
    pushAgentInsight({
      agentId: "ag-lager",
      title: "Umlagerung vorgeschlagen",
      detail:
        "Leder perforiert schwarz: HD17 → HD13 (12 m²). Liefertermin Muster bleibt haltbar.",
      severity: "warn",
      actionLabel: "Details",
    });
  }

  function simulateStandort() {
    pushAgentInsight({
      agentId: "ag-termin",
      title: "Standort-Entscheidung",
      detail:
        "Rumänien 400 € / 5 Tage · Hannover 550 € / 1 Tag → wegen SOP-Druck: Hannover empfohlen.",
      severity: "kritisch",
      href: "/projects",
      actionLabel: "Programme",
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Digitale Zwillinge"
        title="KI-Agenten"
        description="Jeder Agent kennt seinen Bereich – Lager, Termine, Zuweisung, Qualität. Live-Insights für die Präsentation."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/flows">
              <Button variant="secondary">Flow-Generator</Button>
            </Link>
            <Link href="/platform">
              <Button variant="ghost">Hub</Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => (
          <Panel key={a.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-[var(--ink-subtle)]">
                  {agentKindLabel[a.kind]}
                </p>
                <h3 className="mt-0.5 text-lg font-semibold text-[var(--ink)]">
                  {a.name}
                </h3>
              </div>
              <StatusPill
                tone={
                  a.status === "aktiv"
                    ? "ok"
                    : a.status === "beobachtet"
                      ? "watch"
                      : "neutral"
                }
              >
                {a.status}
              </StatusPill>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">{a.description}</p>
            <p className="mt-1 text-xs text-[var(--ink-subtle)]">{a.role}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.focus.map((f) => (
                <span
                  key={f}
                  className="rounded border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--ink-muted)]"
                >
                  {f}
                </span>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Live-Insights">
          <div className="mb-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={simulateLager}>
              Lager-Agent simulieren
            </Button>
            <Button variant="secondary" onClick={simulateStandort}>
              Standort-Konflikt
            </Button>
          </div>
          <ul className="space-y-3">
            {insights.map((ins) => {
              const agent = agents.find((a) => a.id === ins.agentId);
              return (
                <li
                  key={ins.id}
                  className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={severityTone[ins.severity] ?? "neutral"}>
                      {ins.severity}
                    </StatusPill>
                    <span className="text-xs text-[var(--ink-subtle)]">
                      {agent?.name ?? ins.agentId} · {formatDateTime(ins.at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                    {ins.title}
                  </p>
                  <p className="text-sm text-[var(--ink-muted)]">{ins.detail}</p>
                  {ins.href && ins.actionLabel ? (
                    <Link
                      href={ins.href}
                      className="mt-1 inline-block text-xs font-medium text-[var(--accent)]"
                    >
                      {ins.actionLabel} →
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Abt.-Leiter-Agent · Zuweisung">
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            Wer hat Kapazität und die besten Skills? Top-3 für den gewählten
            Auftragstyp.
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(
              [
                "naehauftrag",
                "cad",
                "bezugsentwicklung",
                "zuschnittauftrag",
              ] as TaskType[]
            ).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDemoType(t)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  demoType === t
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--line)] text-[var(--ink-muted)]"
                }`}
              >
                {taskTypeLabel[t]}
              </button>
            ))}
          </div>
          <ol className="space-y-3">
            {suggestions.map((s, i) => (
              <li
                key={s.user.id}
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-[var(--ink)]">
                    {i + 1}. {s.user.name}
                  </p>
                  <StatusPill tone="accent">Score {Math.round(s.score)}</StatusPill>
                </div>
                <p className="text-xs text-[var(--ink-muted)]">
                  {s.user.roleLabel} · {s.user.capacityPercent}% Auslastung
                </p>
                <ul className="mt-1.5 space-y-0.5 text-xs text-[var(--ink-subtle)]">
                  {s.reasons.map((r) => (
                    <li key={r}>· {r}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
