"use client";

import Link from "next/link";
import { AmpelBadge, PageHeader, Panel, StatusPill } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function ManagementPage() {
  const { state } = useStore();

  const ampelCounts = {
    gruen: state.projects.filter((p) => p.ampel === "gruen").length,
    gelb: state.projects.filter((p) => p.ampel === "gelb").length,
    orange: state.projects.filter((p) => p.ampel === "orange").length,
    rot: state.projects.filter((p) => p.ampel === "rot").length,
  };

  const openTasks = state.tasks.filter(
    (t) => !["abgeschlossen", "erledigt", "gestoppt"].includes(t.status),
  );
  const overdue = openTasks.filter((t) => t.dueDate < "2026-09-18");
  const criticalTasks = openTasks.filter((t) => t.risk === "rot" || t.priority === "kritisch");
  const openLops = state.lops.filter((l) => l.status !== "geschlossen");
  const openApprovals = state.approvals.filter((a) => a.decision === "offen");
  const externTasks = state.tasks.filter((t) => t.type === "extern" && t.status !== "abgeschlossen");

  const risks = state.projects
    .filter((p) => p.ampel !== "gruen")
    .sort((a, b) => {
      const order = { rot: 0, orange: 1, gelb: 2, gruen: 3 };
      return order[a.ampel] - order[b.ampel];
    });

  return (
    <div>
      <PageHeader
        eyebrow="Vorgesetzte"
        title="Management-Dashboard"
        description="Von der Ampel bis zur Ursache – verdichtet, klickbar."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">Projekte</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <AmpelBadge ampel="gruen" /> <span>{ampelCounts.gruen || 0} im Plan*</span>
            </div>
            <div className="flex justify-between">
              <AmpelBadge ampel="gelb" /> <span>{ampelCounts.gelb} beobachten</span>
            </div>
            <div className="flex justify-between">
              <AmpelBadge ampel="orange" /> <span>{ampelCounts.orange} gefährdet</span>
            </div>
            <div className="flex justify-between">
              <AmpelBadge ampel="rot" /> <span>{ampelCounts.rot} kritisch</span>
            </div>
            <p className="pt-2 text-xs text-[var(--ink-subtle)]">* Demo: weitere Projekte im Plan möglich</p>
          </div>
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">Aufgaben</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{openTasks.length} offen</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            {overdue.length} überfällig · {criticalTasks.length} kritisch
          </p>
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">LOP / Freigaben</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{openLops.length} LOPs</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{openApprovals.length} Freigaben offen</p>
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">Extern</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{externTasks.length}</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">laufende externe Aufträge</p>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Projektrisiken – Drill-down">
          <ul className="divide-y divide-[var(--line)]">
            {risks.map((p) => {
              const relatedTask = state.tasks.find(
                (t) => t.projectId === p.id && (t.risk === "rot" || t.risk === "orange"),
              );
              return (
                <li key={p.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-medium text-[var(--ink)] hover:text-[var(--accent)]"
                      >
                        {p.name}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">{p.milestoneRisk}</p>
                      {relatedTask ? (
                        <p className="mt-2 text-sm">
                          Ursache:{" "}
                          <Link
                            href={`/tasks/${relatedTask.id}`}
                            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                          >
                            {relatedTask.title}
                          </Link>
                        </p>
                      ) : null}
                    </div>
                    <AmpelBadge ampel={p.ampel} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Kapazität nach Bereich">
          <ul className="space-y-3">
            {state.departments
              .filter((d) =>
                ["engineering", "schnittentwicklung", "naeherei", "zuschnitt", "polsterei"].includes(
                  d.id,
                ),
              )
              .map((d) => (
                <li key={d.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{d.name}</span>
                    <StatusPill
                      tone={
                        d.capacityPercent > 105
                          ? "danger"
                          : d.capacityPercent > 95
                            ? "warn"
                            : "ok"
                      }
                    >
                      {d.capacityPercent} %
                    </StatusPill>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${Math.min(d.capacityPercent, 120)}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--ink-subtle)]">
            Schnittentwicklung 108 % – Kompetenz- und Kapazitätsrisiko sichtbar.
          </p>
        </Panel>
      </div>
    </div>
  );
}
