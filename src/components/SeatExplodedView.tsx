"use client";

import type { ArtFilter } from "@/components/ModuleKindFilter";
import { artFilterLabel } from "@/components/ModuleKindFilter";
import { withBasePath } from "@/lib/nav";
import type { ModuleKind } from "@/lib/types";

type Hotspot = {
  id: ArtFilter;
  /** Katalog-Positionsnummer (wie in ETKA / Teilekatalog) */
  nr: string;
  label: string;
  hint: string;
  /** Position über dem Foto in % */
  x: number;
  y: number;
};

const HOTSPOTS: Hotspot[] = [
  {
    id: "bezug",
    nr: "30",
    label: "Bezug",
    hint: "Sitzbezug / Polsterbezug",
    x: 48,
    y: 28,
  },
  {
    id: "schaum",
    nr: "20",
    label: "Schaum",
    hint: "Polsterschaum Sitzfläche",
    x: 52,
    y: 48,
  },
  {
    id: "struktur",
    nr: "10",
    label: "Struktur",
    hint: "Rahmen / Träger",
    x: 38,
    y: 72,
  },
  {
    id: "kunststoff",
    nr: "40",
    label: "Kunststoff",
    hint: "Seitenteile / Verkleidung",
    x: 18,
    y: 22,
  },
  {
    id: "profil",
    nr: "50",
    label: "Profile",
    hint: "Clips, Drähte, Befestigung",
    x: 78,
    y: 55,
  },
  {
    id: "schnittstelle",
    nr: "60",
    label: "Anbindung",
    hint: "Kabel, Anschlüsse, Anbindung",
    x: 22,
    y: 58,
  },
];

/**
 * Sitz-Übersicht wie im Teilekatalog: Foto mit Positionsnummern.
 * Klick filtert die Modul-Art – keine SVG-Explosionszeichnung.
 */
export function SeatExplodedView({
  selected,
  onSelect,
  counts,
}: {
  selected: ArtFilter;
  onSelect: (art: ArtFilter) => void;
  counts: Partial<Record<ModuleKind | "alle", number>>;
}) {
  function toggle(art: ArtFilter) {
    onSelect(selected === art ? "alle" : art);
  }

  const catalog = withBasePath("/parts/seat-catalog-bom.png");
  const active = selected === "alle" ? null : selected;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(200px,0.7fr)]">
      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)]">
        <div className="relative bg-[#f7f7f5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={catalog}
            alt="Sitz Sitzfläche – Teilekatalog"
            className="block h-auto w-full select-none"
            draggable={false}
          />

          {HOTSPOTS.map((h) => {
            const isOn = active === h.id;
            return (
              <button
                key={h.id}
                type="button"
                title={`${h.nr} · ${h.label}`}
                onClick={() => toggle(h.id)}
                className={`absolute z-10 flex h-7 min-w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border px-1.5 text-[12px] font-bold shadow-sm transition ${
                  isOn
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[#1a3a7a] bg-[#c5d8f5] text-[#0b2a5c] hover:bg-[var(--accent)] hover:text-white"
                }`}
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                {h.nr}
              </button>
            );
          })}
        </div>
        <p className="border-t border-[var(--line)] px-3 py-2 text-xs text-[var(--ink-muted)]">
          Teilekatalog · Positionsnummer anklicken filtert die Bauteile
          {active ? ` · aktiv: ${artFilterLabel(active)}` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--ink-subtle)]">
          Positionen
        </p>
        {HOTSPOTS.map((h) => {
          const n = counts[h.id as ModuleKind] ?? 0;
          const isOn = selected === h.id;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => toggle(h.id)}
              className={`flex items-start gap-2.5 rounded-[var(--radius)] border px-3 py-2.5 text-left transition ${
                isOn
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-sm border text-[11px] font-bold ${
                  isOn
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[#1a3a7a] bg-[#c5d8f5] text-[#0b2a5c]"
                }`}
              >
                {h.nr}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--ink)]">{h.label}</span>
                  <span className="text-xs text-[var(--ink-subtle)]">{n}</span>
                </span>
                <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">{h.hint}</span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onSelect("alle")}
          className={`mt-1 rounded-[var(--radius)] border px-3 py-2 text-left text-sm transition ${
            selected === "alle"
              ? "border-[var(--accent)] bg-[var(--accent-soft)] font-medium"
              : "border-dashed border-[var(--line-strong)] text-[var(--ink-muted)] hover:border-[var(--accent)]"
          }`}
        >
          Alle Positionen zeigen
        </button>
      </div>
    </div>
  );
}
