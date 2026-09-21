"use client";

import { ComingSoon, PageHeader } from "@/components/ui";

const items = [
  {
    title: "KI-Wissenssuche",
    text: "Natürlichsprachliche Fragen zu Materialien, Revisionen, LOPs und ähnlichen Projekten – mit Quellenangabe.",
  },
  {
    title: "Teile-Shop & Restteilebörse",
    text: "Musterteile, Restmaterial und freigegebene Versuchsteile standortübergreifend anfordern.",
  },
  {
    title: "Launch & Checklisten",
    text: "Test-Launch / vorläufige Freigabe ins Werk, Release-Checklisten, PLM-Trigger.",
  },
  {
    title: "Kosten- & Zeittracking",
    text: "Aufgaben und LOPs tracken – Bezug nähen, Dokumentation, Engpässe mit belastbaren Zahlen.",
  },
  {
    title: "Vermessung (H-Punkt)",
    text: "Messergebnisse direkt dem Bauteil zuordnen und historisieren.",
  },
  {
    title: "Frühwarnung & Simulation",
    text: "Kritischer Pfad, Was-wäre-wenn-Szenarien und automatische Eskalation.",
  },
];

export default function VisionPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Roadmap"
        title="Vision – später ausgebaut"
        description="Im Prototyp bewusst als Ausblick: damit die Unternehmensleitung das Zielbild sieht, ohne den Scope zu sprengen."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <ComingSoon key={item.title} title={item.title} text={item.text} />
        ))}
      </div>
    </div>
  );
}
