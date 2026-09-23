"use client";

import Link from "next/link";
import { Button, PageHeader, Panel, StatusPill } from "@/components/ui";
import { useStore } from "@/lib/store";

const links = [
  {
    href: "/platform",
    title: "Übersicht",
    text: "Hub, Kennzahlen, Demo-Drehbuch",
  },
  {
    href: "/flows",
    title: "Flows",
    text: "Prozesse bauen, Nodes, Automationen",
  },
  {
    href: "/agents",
    title: "Agenten",
    text: "Digitale Zwillinge konfigurieren & simulieren",
  },
  {
    href: "/projects",
    title: "Projekte / Programme",
    text: "Struktur, Freigaben, Programmübersicht",
  },
  {
    href: "/materials",
    title: "Materialdatenbank",
    text: "Kaufnummer, Lager, Preis, Lieferant",
  },
  {
    href: "/org",
    title: "Organisation",
    text: "Standorte, Abteilungen, Personen",
  },
  {
    href: "/people",
    title: "Mitarbeiter & Skills",
    text: "Skill-Matrix, Vertretungen",
  },
];

export default function StudioPage() {
  const { state } = useStore();
  const isWorker = state.demoRole === "mitarbeiter";

  return (
    <div>
      <PageHeader
        eyebrow="SeatHub Studio"
        title="Prozesse gestalten"
        description="Hier arbeiten Prozess-Owner und Admins – nicht der Alltag der Produktion. Flows, Agenten und Organisation."
        actions={
          <Link href="/dashboard">
            <Button variant="secondary">Zurück zum Arbeitsplatz</Button>
          </Link>
        }
      />

      {isWorker ? (
        <div className="mb-6 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Du bist als Mitarbeiter unterwegs. Studio ist optional – dein Alltag läuft
          über <strong className="text-[var(--ink)]">Mein Tag</strong> und Aufträge.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Panel className="h-full transition hover:border-[var(--accent)]">
              <h2 className="text-lg font-semibold text-[var(--ink)]">{l.title}</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{l.text}</p>
              <p className="mt-3 text-xs font-medium text-[var(--accent)]">
                Öffnen →
              </p>
            </Panel>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <StatusPill tone="accent">Arbeit vor Architektur</StatusPill>
        <StatusPill>Engine: Flows · Agenten · Automationen</StatusPill>
      </div>
    </div>
  );
}
