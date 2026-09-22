"use client";

import { moduleKindLabel } from "@/lib/structure";
import type { ModuleKind, Part, StructureNode } from "@/lib/types";

export type ArtFilter = ModuleKind | "alle";

export const ART_FILTER_OPTIONS: ArtFilter[] = [
  "alle",
  "bezug",
  "profil",
  "kunststoff",
  "schaum",
  "struktur",
  "metall",
  "schnittstelle",
];

export function artFilterLabel(art: ArtFilter): string {
  if (art === "alle") return "Alle";
  if (art === "struktur") return "Struktur / Metall";
  if (art === "metall") return "Metall";
  return moduleKindLabel[art];
}

/** Struktur/Metall zusammenfassen, wenn eine der beiden gefiltert wird */
export function partMatchesArt(part: Part, art: ArtFilter): boolean {
  if (art === "alle") return true;
  const kind = part.moduleKind;
  if (!kind) return art === "bezug";
  if (kind === art) return true;
  if (art === "metall" && kind === "struktur") return true;
  if (art === "struktur" && kind === "metall") return true;
  return false;
}

export function nodeMatchesArt(node: StructureNode, art: ArtFilter): boolean {
  if (art === "alle") return true;
  if (node.type !== "modul") return true;
  if (!node.moduleKind) return false;
  if (node.moduleKind === art) return true;
  if (art === "metall" && node.moduleKind === "struktur") return true;
  if (art === "struktur" && node.moduleKind === "metall") return true;
  return false;
}

/**
 * Kompakte Art-Filter als Checkbox-Liste (links).
 * Einzelauswahl: ein Klick setzt die Art (wie Radio), „Alle“ setzt zurück.
 */
export function ModuleKindFilter({
  value,
  onChange,
  available,
  layout = "sidebar",
}: {
  value: ArtFilter;
  onChange: (v: ArtFilter) => void;
  available?: ModuleKind[];
  layout?: "sidebar" | "inline";
}) {
  const options = ART_FILTER_OPTIONS.filter((o) => {
    if (o === "alle") return true;
    if (!available || available.length === 0) return true;
    if (available.includes(o)) return true;
    if (o === "metall" && available.includes("struktur")) return true;
    if (o === "struktur" && available.includes("metall")) return true;
    return false;
  });

  if (layout === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[11px] font-medium text-[var(--ink-subtle)]">Art</span>
        {options.map((o) => (
          <label
            key={o}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-[var(--ink-muted)]"
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-[var(--accent)]"
              checked={value === o}
              onChange={() => onChange(o)}
            />
            {artFilterLabel(o)}
          </label>
        ))}
      </div>
    );
  }

  return (
    <aside className="w-full shrink-0 sm:w-40">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-subtle)]">
        Art
      </p>
      <ul className="space-y-0.5">
        {options.map((o) => {
          const active = value === o;
          return (
            <li key={o}>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[12px] leading-tight ${
                  active
                    ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--ink)]"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                  checked={active}
                  onChange={() => onChange(o)}
                />
                <span>{artFilterLabel(o)}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/** Layout: schmale Filter-Spalte links, Inhalt volle Restbreite */
export function ArtFilterLayout({
  filter,
  children,
}: {
  filter: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
      {filter}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
