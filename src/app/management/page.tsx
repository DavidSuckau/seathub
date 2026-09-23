"use client";

import Link from "next/link";
import { AmpelBadge, PageHeader, Panel } from "@/components/ui";
import { departmentCapacityFromTasks } from "@/lib/capacity";
import { useStore } from "@/lib/store";

export default function ManagementPage() {
  const { state } = useStore();

  const total = state.projects.length || 1;
  const ok = state.projects.filter((p) => p.ampel === "gruen").length;
  const watch = state.projects.filter(
    (p) => p.ampel === "gelb" || p.ampel === "orange",
  ).length;
  const critical = state.projects.filter((p) => p.ampel === "rot").length;

  const bottlenecks = state.departments
    .filter((d) =>
      ["engineering", "schnittentwicklung", "naeherei", "zuschnitt", "cad"].includes(
        d.id,
      ),
    )
    .map((d) => {
      const cap = departmentCapacityFromTasks(d.id, state.users, state.tasks);
      return {
        ...d,
        capacityPercent: cap.percent,
        tone:
          cap.percent > 105
            ? ("kritisch" as const)
            : cap.percent > 95
              ? ("risiko" as const)
              : ("ok" as const),
      };
    })
    .sort((a, b) => b.capacityPercent - a.capacityPercent);

  const risks = state.projects
    .filter((p) => p.ampel !== "gruen")
    .sort((a, b) => {
      const order = { rot: 0, orange: 1, gelb: 2, gruen: 3 };
      return order[a.ampel] - order[b.ampel];
    });

  const locationRows = [
    { id: "hannover" as const, name: "Hannover" },
    { id: "rumaenien" as const, name: "Rumänien" },
    { id: "extern" as const, name: "Extern" },
  ].map((loc) => {
    const people = state.users.filter((u) => u.location === loc.id).length;
    const load = Math.max(
      0,
      ...state.departments
        .filter((d) => d.location === loc.id)
        .map(
          (d) =>
            departmentCapacityFromTasks(d.id, state.users, state.tasks).percent,
        ),
      0,
    );
    return { ...loc, people, load: load || (people > 0 ? 0 : 0) };
  });

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Management"
        title="Übersicht"
        description="Wo gibt es Probleme? Eine Seite – keine Cockpit-Galerie."
      />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">
          Gesamtstatus
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[var(--radius)] border border-[var(--ok)]/30 bg-[var(--ok-soft)] px-3 py-4 text-center">
            <p className="text-2xl font-semibold text-[var(--ok)]">
              {Math.round((ok / total) * 100)} %
            </p>
            <p className="text-xs text-[var(--ink-muted)]">im Plan</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--watch)]/30 bg-[var(--watch-soft)] px-3 py-4 text-center">
            <p className="text-2xl font-semibold text-[var(--watch)]">
              {Math.round((watch / total) * 100)} %
            </p>
            <p className="text-xs text-[var(--ink-muted)]">Risiko</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--warn)]/30 bg-[var(--warn-soft)] px-3 py-4 text-center">
            <p className="text-2xl font-semibold text-[var(--warn)]">
              {Math.round((critical / total) * 100)} %
            </p>
            <p className="text-xs text-[var(--ink-muted)]">kritisch</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">Engpässe</h2>
        <ul className="space-y-2">
          {bottlenecks.slice(0, 5).map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5"
            >
              <Link
                href={`/departments/${d.id}`}
                className="font-medium text-[var(--ink)] hover:text-[var(--accent)]"
              >
                {d.name}
              </Link>
              <span
                className={`text-sm font-semibold ${
                  d.tone === "kritisch"
                    ? "text-[var(--warn)]"
                    : d.tone === "risiko"
                      ? "text-[var(--watch)]"
                      : "text-[var(--ok)]"
                }`}
              >
                {d.capacityPercent} %
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">Standorte</h2>
        <ul className="space-y-2">
          {locationRows.map((loc) => (
            <li
              key={loc.id}
              className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--line)] px-3 py-2.5 text-sm"
            >
              <span className="font-medium text-[var(--ink)]">{loc.name}</span>
              <span
                className={
                  loc.load > 105
                    ? "font-semibold text-[var(--warn)]"
                    : loc.load > 95
                      ? "font-semibold text-[var(--watch)]"
                      : "text-[var(--ok)]"
                }
              >
                {loc.load > 0 ? `${loc.load} %` : "—"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Panel title="Abweichungen">
        {risks.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">Keine kritischen Programme.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {risks.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-2 py-3">
                <div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-medium hover:text-[var(--accent)]"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                    {p.milestoneRisk}
                  </p>
                </div>
                <AmpelBadge ampel={p.ampel} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
