"use client";

import Link from "next/link";
import { AmpelBadge, Button, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { DemoRole } from "@/lib/types";

function primaryCta(role: DemoRole, deptId?: string) {
  switch (role) {
    case "extern":
      return { href: "/external", label: "Meine Aufträge öffnen" };
    case "manager":
      return { href: "/platform", label: "Plattform präsentieren" };
    case "engineering":
      return { href: "/platform", label: "Plattform öffnen" };
    default:
      return { href: "/platform", label: "Plattform öffnen" };
  }
}

function secondaryLinks(role: DemoRole, deptId?: string) {
  if (role === "extern") {
    return [{ href: "/vision", label: "Vision", variant: "ghost" as const }];
  }
  if (role === "manager") {
    return [
      { href: "/dashboard", label: "Mein Tag", variant: "secondary" as const },
      { href: "/org", label: "Organisation", variant: "ghost" as const },
    ];
  }
  return [
    { href: "/dashboard", label: "Mein Tag", variant: "secondary" as const },
    {
      href: deptId ? `/departments/${deptId}` : "/departments",
      label: "Meine Abteilung",
      variant: "ghost" as const,
    },
  ];
}

function roleCards(role: DemoRole) {
  if (role === "extern") {
    return [
      {
        href: "/external",
        title: "Meine Aufträge",
        text: "Nur freigegebene Dateien und deine externen Aufträge",
      },
    ];
  }
  if (role === "manager") {
    return [
      { href: "/platform", title: "Plattform", text: "Flows, Agenten, Demo-Drehbuch" },
      { href: "/management", title: "Management", text: "Ampeln, Kapazität, Drill-down" },
      { href: "/flows", title: "Flow-Generator", text: "Prozesse als Nodes" },
      { href: "/agents", title: "KI-Agenten", text: "Digitale Zwillinge live" },
    ];
  }
  return [
    { href: "/platform", title: "Plattform", text: "Flows & Agenten präsentieren" },
    { href: "/dashboard", title: "Mein Tag", text: "Offene Aufträge, LOPs, Risiken" },
    { href: "/flows", title: "Flows", text: "Prozess starten, Folgeaufträge" },
    { href: "/agents", title: "Agenten", text: "Zuweisung & Insights" },
  ];
}

export default function HomePage() {
  const { state, currentUser } = useStore();
  const role = state.demoRole;
  const deptId = currentUser?.departmentId;
  const critical = state.projects.filter((p) => p.ampel === "rot" || p.ampel === "orange");
  const primary = primaryCta(role, deptId);
  const secondary = secondaryLinks(role, deptId);
  const cards = roleCards(role);

  return (
    <div>
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.25fr_0.85fr] lg:py-12">
          <div className="animate-fade-up">
            <p className="text-sm font-medium text-[var(--accent)]">Digitale Plattform</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
              SeatHub
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--ink-muted)]">
              Komplett-Sitzmusterbau, Entwicklung und Musterfertigung – zentral, nachvollziehbar,
              standortübergreifend.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href={primary.href}>
                <Button>{primary.label}</Button>
              </Link>
              {secondary.map((s) => (
                <Link key={s.href + s.label} href={s.href}>
                  <Button variant={s.variant}>{s.label}</Button>
                </Link>
              ))}
            </div>
          </div>
          <div className="animate-fade-up-delay flex flex-col justify-end gap-3">
            <div className="rounded-[var(--radius)] bg-[var(--bg)] p-4">
              <p className="text-xs font-medium text-[var(--ink-subtle)]">Demo</p>
              <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
                Rolle oben wechseln. Einstieg passt sich an. Daten nur lokal – bei Update einmal
                „Reset“.
              </p>
            </div>
            {role !== "extern" ? (
              <div className="rounded-[var(--radius)] border border-[var(--line)] p-4">
                <p className="text-sm font-semibold text-[var(--ink)]">Aktuelle Ampeln</p>
                <ul className="mt-3 space-y-2">
                  {critical.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{p.name}</span>
                      <AmpelBadge ampel={p.ampel} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div
        className={`mt-6 grid gap-3 sm:grid-cols-2 ${
          cards.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-2"
        }`}
      >
        {cards.map((item) => (
          <Link key={item.href + item.title} href={item.href} className="group">
            <Panel className="h-full transition group-hover:border-[var(--accent)] group-hover:shadow-[var(--shadow-md)]">
              <h2 className="text-base font-semibold text-[var(--ink)]">{item.title}</h2>
              <p className="mt-1.5 text-sm text-[var(--ink-muted)]">{item.text}</p>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
