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
  if (art === "alle") return "Alle Arten";
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
  if (node.type !== "modul") return true; // Reihen/Sitzarten immer sichtbar, Inhalt gefiltert
  if (!node.moduleKind) return false;
  if (node.moduleKind === art) return true;
  if (art === "metall" && node.moduleKind === "struktur") return true;
  if (art === "struktur" && node.moduleKind === "metall") return true;
  return false;
}

export function ModuleKindFilter({
  value,
  onChange,
  available,
}: {
  value: ArtFilter;
  onChange: (v: ArtFilter) => void;
  /** Nur Optionen anzeigen, die in den Daten vorkommen (+ Alle) */
  available?: ModuleKind[];
}) {
  const options = ART_FILTER_OPTIONS.filter((o) => {
    if (o === "alle") return true;
    if (!available || available.length === 0) return true;
    if (available.includes(o)) return true;
    if (o === "metall" && available.includes("struktur")) return true;
    if (o === "struktur" && available.includes("metall")) return true;
    return false;
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="mr-1 self-center text-xs font-medium text-[var(--ink-subtle)]">
        Art:
      </span>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            value === o
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--accent)]"
          }`}
        >
          {artFilterLabel(o)}
        </button>
      ))}
    </div>
  );
}
