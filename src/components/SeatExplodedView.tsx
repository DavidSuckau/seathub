"use client";

import type { ArtFilter } from "@/components/ModuleKindFilter";
import { artFilterLabel } from "@/components/ModuleKindFilter";
import { withBasePath } from "@/lib/nav";
import type { ModuleKind } from "@/lib/types";

type Hotspot = {
  id: ArtFilter;
  label: string;
  hint: string;
};

const HOTSPOTS: Hotspot[] = [
  { id: "bezug", label: "Bezug", hint: "Kopfstütze, Lehne, Sitz, Armlehnen" },
  { id: "profil", label: "Profile", hint: "OKR, Nähte, Clips am Bezug" },
  { id: "schaum", label: "Schaum", hint: "Lehnen- & Sitzschaum" },
  { id: "kunststoff", label: "Kunststoff", hint: "Schale & Untergestell" },
  { id: "struktur", label: "Struktur", hint: "Metallrahmen & Gestell" },
  { id: "schnittstelle", label: "Anbindung", hint: "Schienen / Bodenanbindung" },
];

function dim(active: ArtFilter | null, id: ArtFilter) {
  return active && active !== id ? 0.28 : 1;
}

function fill(active: ArtFilter | null, id: ArtFilter, on: string, off: string) {
  return active === id ? on : off;
}

/**
 * Explosionszeichnung eines Captain’s Chair (Bezug / Schaum / Struktur …).
 * Klick filtert die Modul-Art im Programm.
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

  const active = selected === "alle" ? null : selected;
  const photo = withBasePath("/parts/demo-captain-seat.png");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(200px,0.75fr)]">
      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[#f4f1ec]">
        <div className="grid gap-0 sm:grid-cols-[1fr_140px]">
          <svg
            viewBox="0 0 520 460"
            className="h-auto w-full"
            role="img"
            aria-label="Explosionszeichnung Captain’s Chair – Module anklicken"
          >
            <defs>
              <filter id="seat-soft" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity="0.16" />
              </filter>
              <linearGradient id="leder" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c47a45" />
                <stop offset="45%" stopColor="#a85a2e" />
                <stop offset="100%" stopColor="#7a3d1c" />
              </linearGradient>
              <linearGradient id="lederHell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4925c" />
                <stop offset="100%" stopColor="#b56a38" />
              </linearGradient>
              <linearGradient id="schaumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f3e0c4" />
                <stop offset="100%" stopColor="#e0c39a" />
              </linearGradient>
            </defs>

            {/* explosion guides */}
            <g stroke="#c9c2b8" strokeWidth="1.1" strokeDasharray="3 4" opacity="0.85">
              <line x1="250" y1="200" x2="250" y2="48" />
              <line x1="250" y1="210" x2="95" y2="160" />
              <line x1="260" y1="230" x2="400" y2="150" />
              <line x1="250" y1="280" x2="250" y2="360" />
              <line x1="230" y1="300" x2="110" y2="380" />
              <line x1="270" y1="300" x2="390" y2="390" />
            </g>

            {/* --- Anbindung: Schienen (unten) --- */}
            <g
              filter="url(#seat-soft)"
              opacity={dim(active, "schnittstelle")}
              style={{ cursor: "pointer" }}
              onClick={() => toggle("schnittstelle")}
            >
              <title>Anbindung – Sitzschienen</title>
              <rect
                x="145"
                y="400"
                width="230"
                height="10"
                rx="3"
                fill={fill(active, "schnittstelle", "#0b57d0", "#9aa3ad")}
              />
              <rect
                x="155"
                y="416"
                width="210"
                height="8"
                rx="3"
                fill={fill(active, "schnittstelle", "#0842a0", "#7e8791")}
              />
              <text x="260" y="448" textAnchor="middle" fontSize="11" fill="#5f6368">
                Anbindung / Schienen
              </text>
            </g>

            {/* --- Struktur: Metallrahmen (links explodiert) --- */}
            <g
              filter="url(#seat-soft)"
              transform="translate(40,145)"
              opacity={dim(active, "struktur")}
              style={{ cursor: "pointer" }}
              onClick={() => toggle("struktur")}
            >
              <title>Struktur / Metall</title>
              <path
                d="M28 8 L52 0 L68 40 L68 120 L48 132 L28 118 Z"
                fill={fill(active, "struktur", "#0b57d0", "#8a929b")}
                stroke="#4a525a"
                strokeWidth="1.4"
              />
              <path
                d="M28 118 L68 118 L88 142 L52 160 L18 142 Z"
                fill={fill(active, "struktur", "#0842a0", "#6d757e")}
                stroke="#3a424a"
                strokeWidth="1.4"
              />
              <circle cx="40" cy="55" r="3.5" fill="#f4f1ec" />
              <circle cx="40" cy="95" r="3.5" fill="#f4f1ec" />
              <text x="48" y="185" textAnchor="middle" fontSize="11" fill="#5f6368">
                Struktur
              </text>
            </g>

            {/* --- Schaum: Lehne + Sitz (links oben / Mitte) --- */}
            <g
              filter="url(#seat-soft)"
              opacity={dim(active, "schaum")}
              style={{ cursor: "pointer" }}
              onClick={() => toggle("schaum")}
            >
              <title>Schaum</title>
              {/* Lehnenschaum */}
              <path
                d="M95 95 C115 70 155 65 175 90 C190 125 185 170 165 195 C135 185 110 185 90 195 C78 155 80 120 95 95 Z"
                fill={fill(active, "schaum", "#a8c7fa", "url(#schaumGrad)")}
                stroke={fill(active, "schaum", "#0b57d0", "#c9a87a")}
                strokeWidth="1.3"
              />
              {/* Sitzschaum */}
              <ellipse
                cx="155"
                cy="230"
                rx="70"
                ry="26"
                fill={fill(active, "schaum", "#d3e3fd", "#edd4b0")}
                stroke={fill(active, "schaum", "#0b57d0", "#c9a87a")}
                strokeWidth="1.3"
              />
              <text x="130" y="70" fontSize="11" fill="#5f6368">
                Schaum
              </text>
            </g>

            {/* --- Kunststoff: Schale / Pedestal (rechts unten) --- */}
            <g
              filter="url(#seat-soft)"
              transform="translate(340,300)"
              opacity={dim(active, "kunststoff")}
              style={{ cursor: "pointer" }}
              onClick={() => toggle("kunststoff")}
            >
              <title>Kunststoffschale</title>
              <path
                d="M10 25 C40 5 95 8 120 35 C135 65 125 105 90 120 C45 132 15 115 5 80 Z"
                fill={fill(active, "kunststoff", "#d3e3fd", "#2a2e33")}
                stroke={fill(active, "kunststoff", "#0b57d0", "#111418")}
                strokeWidth="1.4"
              />
              <path
                d="M35 115 L95 115 L105 145 L25 145 Z"
                fill={fill(active, "kunststoff", "#0842a0", "#1a1e22")}
              />
              <text x="65" y="168" textAnchor="middle" fontSize="11" fill="#5f6368">
                Kunststoff
              </text>
            </g>

            {/* --- Profile (rechts oben, streifen) --- */}
            <g
              filter="url(#seat-soft)"
              transform="translate(365,95)"
              opacity={dim(active, "profil")}
              style={{ cursor: "pointer" }}
              onClick={() => toggle("profil")}
            >
              <title>Profile / OKR</title>
              <rect
                x="0"
                y="0"
                width="100"
                height="12"
                rx="3"
                fill={fill(active, "profil", "#0b57d0", "#5c6874")}
              />
              <rect
                x="6"
                y="18"
                width="88"
                height="9"
                rx="2"
                fill={fill(active, "profil", "#0842a0", "#7a8794")}
              />
              <rect
                x="12"
                y="33"
                width="76"
                height="7"
                rx="2"
                fill={fill(active, "profil", "#062e70", "#9aa6b2")}
              />
              <text x="50" y="58" textAnchor="middle" fontSize="11" fill="#5f6368">
                Profile
              </text>
            </g>

            {/* --- Bezug: Captain’s Chair (Hauptstück, Mitte) --- */}
            <g
              filter="url(#seat-soft)"
              opacity={dim(active, "bezug")}
              style={{ cursor: "pointer" }}
              onClick={() => toggle("bezug")}
            >
              <title>Bezug – Captain’s Chair</title>

              {/* Kopfstütze */}
              <rect
                x="228"
                y="28"
                width="44"
                height="36"
                rx="10"
                fill={fill(active, "bezug", "#0b57d0", "url(#lederHell)")}
                stroke="#6a3a1c"
                strokeWidth="1.2"
              />
              <line
                x1="240"
                y1="64"
                x2="240"
                y2="78"
                stroke="#8a8f96"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="260"
                y1="64"
                x2="260"
                y2="78"
                stroke="#8a8f96"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Lehne mit Wangen */}
              <path
                d="M200 85 C225 70 275 70 300 88 C318 130 315 195 295 235 C260 220 220 220 185 238 C168 190 172 120 200 85 Z"
                fill={fill(active, "bezug", "#0b57d0", "url(#leder)")}
                stroke="#6a3a1c"
                strokeWidth="1.4"
              />
              {/* Rippennähte */}
              <g
                stroke={active === "bezug" ? "#d3e3fd" : "#8a4a28"}
                strokeWidth="1"
                opacity="0.55"
                fill="none"
              >
                <path d="M230 100 L228 210" />
                <path d="M242 95 L242 215" />
                <path d="M254 95 L254 215" />
                <path d="M266 100 L268 210" />
              </g>

              {/* Armlehnen */}
              <ellipse
                cx="178"
                cy="200"
                rx="22"
                ry="12"
                fill={fill(active, "bezug", "#0842a0", "#9a5530")}
                stroke="#6a3a1c"
                strokeWidth="1.1"
              />
              <ellipse
                cx="322"
                cy="200"
                rx="22"
                ry="12"
                fill={fill(active, "bezug", "#0842a0", "#9a5530")}
                stroke="#6a3a1c"
                strokeWidth="1.1"
              />

              {/* Sitzfläche */}
              <path
                d="M185 240 C220 218 280 218 315 242 C335 275 330 310 300 325 C250 340 200 335 175 315 C158 285 165 255 185 240 Z"
                fill={fill(active, "bezug", "#0842a0", "url(#lederHell)")}
                stroke="#6a3a1c"
                strokeWidth="1.4"
              />
              <g
                stroke={active === "bezug" ? "#d3e3fd" : "#8a4a28"}
                strokeWidth="1"
                opacity="0.5"
                fill="none"
              >
                <path d="M215 250 L210 310" />
                <path d="M235 245 L235 318" />
                <path d="M255 245 L255 320" />
                <path d="M275 250 L280 312" />
              </g>

              <text x="250" y="355" textAnchor="middle" fontSize="12" fontWeight="600" fill="#5f6368">
                Bezug
              </text>
            </g>
          </svg>

          <div className="hidden border-l border-[var(--line)] bg-[var(--surface)] sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="Referenz Captain’s Chair"
              className="h-full w-full object-cover"
            />
            <p className="border-t border-[var(--line)] px-2 py-1.5 text-[10px] text-[var(--ink-subtle)]">
              Referenzfoto
            </p>
          </div>
        </div>
        <p className="border-t border-[var(--line)] bg-[var(--surface)]/90 px-3 py-2 text-xs text-[var(--ink-muted)]">
          Explosionszeichnung Captain’s Chair · Modul anklicken filtert Bauteile
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
