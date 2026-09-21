"use client";

import { FilterChip } from "@/components/ui";
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
  if (node.type !== "modul") return true;
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
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-0.5 text-[11px] font-medium text-[var(--ink-subtle)]">Art</span>
      {options.map((o) => (
        <FilterChip key={o} active={value === o} onClick={() => onChange(o)}>
          {artFilterLabel(o)}
        </FilterChip>
      ))}
    </div>
  );
}
