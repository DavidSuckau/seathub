"use client";

import type { ArtFilter } from "@/components/ModuleKindFilter";
import { isComponentPart } from "@/lib/components";
import { navigateToPart, partPath } from "@/lib/nav";
import { moduleKindLabel } from "@/lib/structure";
import type { ModuleKind, Part } from "@/lib/types";
import Link from "next/link";

type LayerId = Extract<
  ArtFilter,
  "bezug" | "schaum" | "struktur" | "kunststoff" | "schnittstelle" | "profil"
>;

const LAYERS: {
  id: LayerId;
  label: string;
  match: (p: Part) => boolean;
}[] = [
  {
    id: "bezug",
    label: "Bezug",
    match: (p) =>
      !isComponentPart(p) &&
      (p.moduleKind === "bezug" || p.partKind === "hauptteil" || !p.moduleKind),
  },
  {
    id: "schaum",
    label: "Schaum",
    match: (p) => p.moduleKind === "schaum" || p.partKind === "schaum",
  },
  {
    id: "struktur",
    label: "Struktur",
    match: (p) =>
      p.moduleKind === "struktur" || p.moduleKind === "metall",
  },
  {
    id: "kunststoff",
    label: "Kunststoff",
    match: (p) => p.moduleKind === "kunststoff",
  },
  {
    id: "schnittstelle",
    label: "Anbindung",
    match: (p) => p.moduleKind === "schnittstelle",
  },
  {
    id: "profil",
    label: "Profile",
    match: (p) =>
      p.partKind === "profil" ||
      p.partKind === "befestigung" ||
      p.moduleKind === "profil",
  },
];

/**
 * Eigene Sitzzeichnung (Katalog-Stil).
 * Module erscheinen, sobald Bauteile existieren; jedes Profil wird einzeln eingezeichnet.
 */
export function SeatExplodedView({
  parts,
  selected,
  onSelect,
}: {
  parts: Part[];
  selected: ArtFilter;
  onSelect: (art: ArtFilter) => void;
  counts?: Partial<Record<ModuleKind | "alle", number>>;
}) {
  function toggle(art: ArtFilter) {
    onSelect(selected === art ? "alle" : art);
  }

  const byLayer = Object.fromEntries(
    LAYERS.map((l) => [l.id, parts.filter(l.match)]),
  ) as Record<LayerId, Part[]>;

  const profiles = byLayer.profil;
  const active = selected === "alle" ? null : selected;

  function layerOn(id: LayerId) {
    return byLayer[id].length > 0;
  }

  function opacity(id: LayerId) {
    if (!layerOn(id)) return 0.22;
    if (active && active !== id) return 0.3;
    return 1;
  }

  function stroke(id: LayerId) {
    if (active === id) return "#0b57d0";
    if (!layerOn(id)) return "#b0b6be";
    return "#2a3038";
  }

  function fill(id: LayerId, solid: string, empty = "#f7f8fa") {
    if (!layerOn(id)) return empty;
    if (active === id) return "#d3e3fd";
    return solid;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.75fr)]">
      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[#fafbfc]">
        <svg
          viewBox="0 0 640 480"
          className="h-auto w-full"
          role="img"
          aria-label="Sitzzeichnung – Bauteile und Profile"
        >
          <defs>
            <filter id="draw-soft" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Kontext: kleiner Sitz oben rechts */}
          <g transform="translate(520,18)" opacity="0.55">
            <rect x="0" y="0" width="100" height="70" rx="4" fill="#fff" stroke="#c9d0dc" />
            <path
              d="M25 18 C40 8 60 8 72 20 C80 40 78 55 65 62 C45 58 30 58 22 62 C14 48 15 28 25 18 Z"
              fill="none"
              stroke="#5f6368"
              strokeWidth="1.2"
            />
            <path
              d="M22 58 C40 50 60 50 75 58 C78 68 55 74 35 72 C22 70 18 64 22 58 Z"
              fill="none"
              stroke="#5f6368"
              strokeWidth="1.2"
            />
            <text x="50" y="66" textAnchor="middle" fontSize="8" fill="#80868b">
              Kontext
            </text>
          </g>

          {/* Führungslinien */}
          <g stroke="#d5dae2" strokeWidth="1" strokeDasharray="3 3">
            <line x1="320" y1="90" x2="320" y2="380" />
            <line x1="200" y1="200" x2="120" y2="120" />
            <line x1="420" y1="210" x2="520" y2="140" />
            <line x1="280" y1="340" x2="160" y2="400" />
            <line x1="360" y1="340" x2="480" y2="400" />
          </g>

          {/* --- Anbindung / Schienen --- */}
          <g
            opacity={opacity("schnittstelle")}
            style={{ cursor: "pointer" }}
            onClick={() => toggle("schnittstelle")}
            filter="url(#draw-soft)"
          >
            <title>Anbindung</title>
            <rect
              x="210"
              y="400"
              width="220"
              height="12"
              rx="2"
              fill={fill("schnittstelle", "#e8eaed")}
              stroke={stroke("schnittstelle")}
              strokeWidth="1.4"
              strokeDasharray={layerOn("schnittstelle") ? undefined : "4 3"}
            />
            <rect
              x="220"
              y="418"
              width="200"
              height="10"
              rx="2"
              fill={fill("schnittstelle", "#e8eaed")}
              stroke={stroke("schnittstelle")}
              strokeWidth="1.3"
              strokeDasharray={layerOn("schnittstelle") ? undefined : "4 3"}
            />
            <text x="320" y="448" textAnchor="middle" fontSize="11" fill="#5f6368">
              Anbindung{layerOn("schnittstelle") ? ` · ${byLayer.schnittstelle.length}` : ""}
            </text>
          </g>

          {/* --- Struktur --- */}
          <g
            opacity={opacity("struktur")}
            style={{ cursor: "pointer" }}
            onClick={() => toggle("struktur")}
            filter="url(#draw-soft)"
            transform="translate(90,250)"
          >
            <title>Struktur</title>
            <path
              d="M20 10 L70 0 L110 30 L115 100 L70 120 L20 100 Z"
              fill={fill("struktur", "#eceff2")}
              stroke={stroke("struktur")}
              strokeWidth="1.5"
              strokeDasharray={layerOn("struktur") ? undefined : "4 3"}
            />
            <path
              d="M30 45 H100 M30 70 H100 M45 20 V95"
              fill="none"
              stroke={stroke("struktur")}
              strokeWidth="1.1"
              opacity="0.5"
            />
            <text x="65" y="145" textAnchor="middle" fontSize="11" fill="#5f6368">
              Struktur{layerOn("struktur") ? ` · ${byLayer.struktur.length}` : ""}
            </text>
          </g>

          {/* --- Schaum --- */}
          <g
            opacity={opacity("schaum")}
            style={{ cursor: "pointer" }}
            onClick={() => toggle("schaum")}
            filter="url(#draw-soft)"
            transform="translate(200,200)"
          >
            <title>Schaum</title>
            <path
              d="M20 40 C60 10 160 10 200 40 C220 70 210 110 170 125 C100 140 50 135 20 115 C5 85 5 55 20 40 Z"
              fill={fill("schaum", "#f3ebe3")}
              stroke={stroke("schaum")}
              strokeWidth="1.5"
              strokeDasharray={layerOn("schaum") ? undefined : "4 3"}
            />
            <text x="110" y="155" textAnchor="middle" fontSize="11" fill="#5f6368">
              Schaum{layerOn("schaum") ? ` · ${byLayer.schaum.length}` : ""}
            </text>
          </g>

          {/* --- Kunststoff (seitlich) --- */}
          <g
            opacity={opacity("kunststoff")}
            style={{ cursor: "pointer" }}
            onClick={() => toggle("kunststoff")}
            filter="url(#draw-soft)"
            transform="translate(40,120)"
          >
            <title>Kunststoff</title>
            <path
              d="M10 20 C30 5 55 8 70 30 C80 55 70 95 45 110 C20 115 5 90 5 60 Z"
              fill={fill("kunststoff", "#eef1f4")}
              stroke={stroke("kunststoff")}
              strokeWidth="1.5"
              strokeDasharray={layerOn("kunststoff") ? undefined : "4 3"}
            />
            <text x="40" y="135" textAnchor="middle" fontSize="11" fill="#5f6368">
              Kunststoff{layerOn("kunststoff") ? ` · ${byLayer.kunststoff.length}` : ""}
            </text>
          </g>

          {/* --- Bezug (Hauptfläche) --- */}
          <g
            opacity={opacity("bezug")}
            style={{ cursor: "pointer" }}
            onClick={() => toggle("bezug")}
            filter="url(#draw-soft)"
            transform="translate(210,70)"
          >
            <title>Bezug</title>
            <path
              d="M30 50 C70 15 150 15 190 50 C215 90 205 150 160 175 C100 195 50 185 20 155 C5 115 10 70 30 50 Z"
              fill={fill("bezug", "#f7f5f2")}
              stroke={stroke("bezug")}
              strokeWidth="1.6"
              strokeDasharray={layerOn("bezug") ? undefined : "4 3"}
            />
            {/* Rippennähte */}
            <g stroke={stroke("bezug")} strokeWidth="0.9" opacity="0.35" fill="none">
              <path d="M70 55 L65 150" />
              <path d="M95 45 L95 160" />
              <path d="M120 45 L125 160" />
              <path d="M145 55 L150 150" />
            </g>
            <text x="110" y="205" textAnchor="middle" fontSize="12" fontWeight="600" fill="#5f6368">
              Bezug{layerOn("bezug") ? ` · ${byLayer.bezug.length}` : ""}
            </text>
          </g>

          {/* --- Profile: jedes Profil als eigener Streifen --- */}
          <g opacity={opacity("profil")}>
            <text x="520" y="100" textAnchor="middle" fontSize="11" fill="#5f6368">
              Profile
            </text>
            {profiles.length === 0 ? (
              <g
                style={{ cursor: "pointer" }}
                onClick={() => toggle("profil")}
                transform="translate(470,115)"
              >
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="14"
                  rx="3"
                  fill="#fafbfc"
                  stroke="#b0b6be"
                  strokeWidth="1.3"
                  strokeDasharray="4 3"
                />
                <text x="50" y="36" textAnchor="middle" fontSize="10" fill="#80868b">
                  noch keines
                </text>
              </g>
            ) : (
              profiles.map((p, i) => {
                const y = 115 + i * 42;
                const isActive =
                  active === "profil" || selected === "alle" || !active;
                return (
                  <g
                    key={p.id}
                    transform={`translate(455,${y})`}
                    opacity={isActive ? 1 : 0.35}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigateToPart(p.id)}
                  >
                    <title>
                      {p.partNumber} · {p.name}
                    </title>
                    <rect
                      x="0"
                      y="0"
                      width="120"
                      height="16"
                      rx="3"
                      fill={active === "profil" ? "#d3e3fd" : "#fff"}
                      stroke={active === "profil" ? "#0b57d0" : "#2a3038"}
                      strokeWidth="1.4"
                    />
                    <path
                      d="M8 4 H112 M12 8 H108 M16 12 H104"
                      fill="none"
                      stroke={active === "profil" ? "#0b57d0" : "#5c6874"}
                      strokeWidth="1.2"
                      pointerEvents="none"
                    />
                    <text
                      x="60"
                      y="30"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#5f6368"
                      pointerEvents="none"
                    >
                      {p.partNumber.length > 16
                        ? `${p.partNumber.slice(0, 14)}…`
                        : p.partNumber}
                    </text>
                    <line
                      x1="0"
                      y1="8"
                      x2="-80"
                      y2={40 - i * 8}
                      stroke="#c9d0dc"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      pointerEvents="none"
                    />
                  </g>
                );
              })
            )}
          </g>

          {!parts.length ? (
            <text x="320" y="250" textAnchor="middle" fontSize="13" fill="#80868b">
              Noch keine Bauteile – Zeichnung füllt sich beim Anlegen
            </text>
          ) : null}
        </svg>
        <p className="border-t border-[var(--line)] px-3 py-2 text-xs text-[var(--ink-muted)]">
          Eigene Sitzzeichnung · Module erscheinen mit Bauteilen · jedes Profil wird
          eingezeichnet
          {profiles.length > 0 ? ` · ${profiles.length} Profil(e)` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--ink-subtle)]">
          In der Zeichnung
        </p>
        {LAYERS.map((l) => {
          const list = byLayer[l.id];
          const isOn = selected === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => toggle(l.id)}
              className={`rounded-[var(--radius)] border px-3 py-2.5 text-left transition ${
                isOn
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--ink)]">
                  {l.label}
                </span>
                <span className="text-xs text-[var(--ink-subtle)]">{list.length}</span>
              </span>
              <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
                {list.length === 0
                  ? "noch nicht angelegt"
                  : list.length === 1
                    ? list[0].partNumber
                    : `${list.slice(0, 2).map((p) => p.partNumber).join(", ")}${
                        list.length > 2 ? "…" : ""
                      }`}
              </span>
            </button>
          );
        })}

        {profiles.length > 0 ? (
          <div className="mt-2 space-y-1.5 border-t border-[var(--line)] pt-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--ink-subtle)]">
              Profile öffnen
            </p>
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={partPath(p.id)}
                className="block rounded-md border border-[var(--line)] px-2.5 py-2 text-sm hover:border-[var(--accent)]"
              >
                <span className="font-mono text-[13px] text-[var(--accent)]">
                  {p.partNumber}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
                  {p.name}
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => onSelect("alle")}
          className={`mt-1 rounded-[var(--radius)] border px-3 py-2 text-left text-sm transition ${
            selected === "alle"
              ? "border-[var(--accent)] bg-[var(--accent-soft)] font-medium"
              : "border-dashed border-[var(--line-strong)] text-[var(--ink-muted)] hover:border-[var(--accent)]"
          }`}
        >
          Alles zeigen
        </button>
      </div>
    </div>
  );
}

/** Kurzlabel für Debug / Sidebar */
export function seatLayerLabel(kind: ModuleKind): string {
  return moduleKindLabel[kind] ?? kind;
}
