"use client";

import Link from "next/link";
import { Button, PageHeader, Panel, StatusPill } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function PlatformPage() {
  const { state } = useStore();
  const flows = state.flows ?? [];
  const agents = state.agents ?? [];
  const insights = state.agentInsights ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Vision live"
        title="Digitale Unternehmensplattform"
        description="SeatHub als Domäne – Flow-Generator, KI-Agenten und automatische Folgeaufträge für die Präsentation."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel>
          <p className="text-xs uppercase tracking-wide text-[var(--ink-subtle)]">
            Flows
          </p>
          <p className="mt-1 text-3xl font-semibold">{flows.length}</p>
          <p className="text-sm text-[var(--ink-muted)]">Prozessvorlagen</p>
        </Panel>
        <Panel>
          <p className="text-xs uppercase tracking-wide text-[var(--ink-subtle)]">
            Agenten
          </p>
          <p className="mt-1 text-3xl font-semibold">{agents.length}</p>
          <p className="text-sm text-[var(--ink-muted)]">digitale Zwillinge</p>
        </Panel>
        <Panel>
          <p className="text-xs uppercase tracking-wide text-[var(--ink-subtle)]">
            Insights
          </p>
          <p className="mt-1 text-3xl font-semibold">{insights.length}</p>
          <p className="text-sm text-[var(--ink-muted)]">offene Signale</p>
        </Panel>
        <Panel>
          <p className="text-xs uppercase tracking-wide text-[var(--ink-subtle)]">
            Aufträge
          </p>
          <p className="mt-1 text-3xl font-semibold">{state.tasks.length}</p>
          <p className="text-sm text-[var(--ink-muted)]">im System</p>
        </Panel>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Panel title="1 · Flow-Generator">
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            Nodes für Auftrag, Agent, Lager, Freigabe. Drag & Drop, Auto-Folge
            beim Abschluss.
          </p>
          <Link href="/flows">
            <Button>Flows öffnen</Button>
          </Link>
        </Panel>
        <Panel title="2 · KI-Agenten">
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            Lager-, Termin-, Ressourcen- und Abteilungsleiter-Agenten mit Live-
            Insights und Zuweisungsvorschlägen.
          </p>
          <Link href="/agents">
            <Button>Agenten öffnen</Button>
          </Link>
        </Panel>
        <Panel title="3 · Domäne SeatHub">
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            Programme, Bezüge, LOPs, Freigaben – die Fachschicht, die die Agenten
            orchestrieren.
          </p>
          <Link href="/projects">
            <Button variant="secondary">Projekte</Button>
          </Link>
        </Panel>
      </div>

      <Panel title="Demo-Drehbuch (3 Minuten)">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--ink-muted)]">
          <li>
            <strong className="text-[var(--ink)]">Flow öffnen</strong> – „Sitzbezug
            Muster“ zeigen, Nodes verschieben.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Prozess starten</strong> – TN
            wählen → erster Auftrag mit Checkliste.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Checkliste abhaken</strong> –
            Auftrag erledigen → Folgeauftrag (CAD) entsteht automatisch.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Agenten</strong> – Zuweisung Top-3
            + Lager/Standort-Simulation.
          </li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill tone="ok">Mensch entscheidet</StatusPill>
          <StatusPill tone="accent">Agent plant & bereitet vor</StatusPill>
          <StatusPill>Flow orchestriert</StatusPill>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/flows">
            <Button>Demo starten · Flows</Button>
          </Link>
          <Link href="/agents">
            <Button variant="secondary">Agenten zeigen</Button>
          </Link>
        </div>
      </Panel>

      {insights.length > 0 ? (
        <Panel title="Aktuelle Agent-Insights" className="mt-4">
          <ul className="space-y-2">
            {insights.slice(0, 5).map((ins) => (
              <li
                key={ins.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{ins.title}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{ins.detail}</p>
                </div>
                <StatusPill
                  tone={
                    ins.severity === "ok"
                      ? "ok"
                      : ins.severity === "warn"
                        ? "warn"
                        : ins.severity === "kritisch"
                          ? "danger"
                          : "accent"
                  }
                >
                  {ins.severity}
                </StatusPill>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
