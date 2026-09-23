"use client";

import type { ArtFilter } from "@/components/ModuleKindFilter";
import { artFilterLabel } from "@/components/ModuleKindFilter";
import type { ModuleKind } from "@/lib/types";

type Hotspot = {
  id: ArtFilter;
  label: string;
  hint: string;
};

const HOTSPOTS: Hotspot[] = [
  { id: "bezug", label: "Bezug", hint: "Bezugvarianten & Zuschnitt" },
  { id: "profil", label: "Profile", hint: "OKR, Clips am Bezug" },
  { id: "schaum", label: "Schaum", hint: "Sitz- & Lehnenschaum" },
  { id: "kunststoff", label: "Kunststoff", hint: "Schalen & Anbauteile" },
  { id: "struktur", label: "Struktur", hint: "Metallrahmen" },
  { id: "schnittstelle", label: "Anbindung", hint: "Schnittstelle zum Sitz" },
];

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

  const active = selected === "alle" ? null : selected;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
      <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[linear-gradient(160deg,#f7f8fa_0%,#eef1f5_55%,#e8ecf2_100%)]">
        <svg
          viewBox="0 0 640 420"
          className="h-auto w-full"
          role="img"
          aria-label="Explosionszeichnung Sitz – Module anklicken"
        >
          <defs>
            <filter id="seat-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Leader / explosion axes */}
          <g stroke="#c9d0dc" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.9">
            <line x1="200" y1="210" x2="120" y2="90" />
            <line x1="250" y1="200" x2="300" y2="70" />
            <line x1="280" y1="250" x2="380" y2="140" />
            <line x1="240" y1="300" x2="360" y2="320" />
            <line x1="180" y1="280" x2="90" y2="340" />
            <line x1="160" y1="220" x2="70" y2="220" />
          </g>

          {/* Struktur – farthest back / left */}
          <g
            filter="url(#seat-soft)"
            transform="translate(55,175)"
            opacity={active && active !== "struktur" ? 0.35 : 1}
            style={{ cursor: "pointer" }}
            onClick={() => toggle("struktur")}
          >
            <title>Struktur / Metall</title>
            <path
              d="M40 20 L70 10 L95 55 L95 130 L70 145 L40 130 Z"
              fill={active === "struktur" ? "#0b57d0" : "#8b949e"}
              stroke="#4f575f"
              strokeWidth="1.5"
            />
            <path
              d="M40 130 L95 130 L120 155 L70 175 L30 155 Z"
              fill={active === "struktur" ? "#0842a0" : "#6d7680"}
              stroke="#3a424a"
              strokeWidth="1.5"
            />
            <circle cx="55" cy="70" r="4" fill="#f7f8fa" />
            <circle cx="55" cy="110" r="4" fill="#f7f8fa" />
          </g>

          {/* Schaum – middle left-up */}
          <g
            filter="url(#seat-soft)"
            transform="translate(95,95)"
            opacity={active && active !== "schaum" ? 0.35 : 1}
            style={{ cursor: "pointer" }}
            onClick={() => toggle("schaum")}
          >
            <title>Schaum</title>
            <ellipse
              cx="95"
              cy="145"
              rx="78"
              ry="28"
              fill={active === "schaum" ? "#d3e3fd" : "#f0d8b8"}
              stroke={active === "schaum" ? "#0b57d0" : "#c9a87a"}
              strokeWidth="1.5"
            />
            <path
              d="M40 40 C70 15 130 15 155 45 C170 85 165 130 145 150 C100 140 60 140 35 150 C20 110 20 70 40 40 Z"
              fill={active === "schaum" ? "#a8c7fa" : "#e8c9a0"}
              stroke={active === "schaum" ? "#0b57d0" : "#b89268"}
              strokeWidth="1.5"
            />
          </g>

          {/* Bezug – main seat, slightly forward */}
          <g
            filter="url(#seat-soft)"
            transform="translate(175,70)"
            opacity={active && active !== "bezug" && active !== "profil" ? 0.35 : 1}
            style={{ cursor: "pointer" }}
            onClick={() => toggle("bezug")}
          >
            <title>Bezug</title>
            <path
              d="M55 25 C95 5 145 12 165 50 C185 100 178 175 145 215 C105 200 60 198 30 215 C10 160 15 80 55 25 Z"
              fill={active === "bezug" ? "#0b57d0" : "#4a433c"}
              stroke={active === "bezug" ? "#0842a0" : "#2f2a26"}
              strokeWidth="1.6"
            />
            <path
              d="M28 210 C70 188 125 185 165 210 C185 245 188 285 165 310 C105 328 45 322 20 295 C8 260 12 230 28 210 Z"
              fill={active === "bezug" ? "#0842a0" : "#3a342f"}
              stroke={active === "bezug" ? "#062e70" : "#221e1b"}
              strokeWidth="1.6"
            />
            {/* side bolster seam hint */}
            <path
              d="M48 55 C70 45 85 80 78 120"
              fill="none"
              stroke="#cfc6ba"
              strokeWidth="1.2"
              opacity="0.55"
            />
          </g>

          {/* Profil – small strip on cover */}
          <g
            filter="url(#seat-soft)"
            transform="translate(285,55)"
            opacity={active && active !== "profil" ? 0.35 : 1}
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              toggle("profil");
            }}
          >
            <title>Profile</title>
            <rect
              x="0"
              y="0"
              width="110"
              height="14"
              rx="4"
              fill={active === "profil" ? "#0b57d0" : "#5c6874"}
              stroke="#3e4852"
              strokeWidth="1.2"
            />
            <rect
              x="8"
              y="20"
              width="94"
              height="10"
              rx="3"
              fill={active === "profil" ? "#0842a0" : "#7a8794"}
            />
          </g>

          {/* Kunststoff – lower right */}
          <g
            filter="url(#seat-soft)"
            transform="translate(330,250)"
            opacity={active && active !== "kunststoff" ? 0.35 : 1}
            style={{ cursor: "pointer" }}
            onClick={() => toggle("kunststoff")}
          >
            <title>Kunststoff</title>
            <path
              d="M20 20 C55 0 110 5 135 35 C150 70 140 115 105 135 C55 150 20 130 10 90 Z"
              fill={active === "kunststoff" ? "#d3e3fd" : "#9eb0bc"}
              stroke={active === "kunststoff" ? "#0b57d0" : "#5f717c"}
              strokeWidth="1.5"
            />
          </g>

          {/* Anbindung – far left connector */}
          <g
            filter="url(#seat-soft)"
            transform="translate(40,200)"
            opacity={active && active !== "schnittstelle" ? 0.35 : 1}
            style={{ cursor: "pointer" }}
            onClick={() => toggle("schnittstelle")}
          >
            <title>Anbindung</title>
            <rect
              x="0"
              y="0"
              width="36"
              height="70"
              rx="6"
              fill={active === "schnittstelle" ? "#0b57d0" : "#b0bac4"}
              stroke="#556068"
              strokeWidth="1.3"
            />
            <circle cx="18" cy="22" r="5" fill="#f7f8fa" />
            <circle cx="18" cy="48" r="5" fill="#f7f8fa" />
          </g>

          {/* Labels near pieces */}
          <g fontFamily="system-ui,sans-serif" fontSize="12" fill="#5f6368">
            <text x="70" y="78">Struktur</text>
            <text x="210" y="55">Schaum</text>
            <text x="410" y="95">Profile</text>
            <text x="455" y="245">Bezug</text>
            <text x="470" y="360">Kunststoff</text>
            <text x="28" y="190">Anbindung</text>
          </g>
        </svg>
        <p className="border-t border-[var(--line)] bg-[var(--surface)]/80 px-3 py-2 text-xs text-[var(--ink-muted)]">
          Explosionszeichnung · Modul anklicken filtert die Bauteile darunter
          {active ? ` · aktiv: ${artFilterLabel(active)}` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--ink-subtle)]">
          Module
        </p>
        {HOTSPOTS.map((h) => {
          const n = counts[h.id as ModuleKind] ?? 0;
          const isOn = selected === h.id;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => toggle(h.id)}
              className={`rounded-[var(--radius)] border px-3 py-2.5 text-left transition ${
                isOn
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--ink)]">{h.label}</span>
                <span className="text-xs text-[var(--ink-subtle)]">{n}</span>
              </span>
              <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">{h.hint}</span>
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
          Alle Module zeigen
        </button>
      </div>
    </div>
  );
}
