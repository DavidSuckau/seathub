import type { ComponentStandRef, Part, Revision } from "./types";

/** IDs der Bezüge/Assemblierungen, die diese Komponente nutzen */
export function getUsedOnPartIds(part: Part): string[] {
  if (part.usedOnPartIds && part.usedOnPartIds.length > 0) {
    return part.usedOnPartIds;
  }
  return part.parentPartId ? [part.parentPartId] : [];
}

export function isComponentPart(part: Part): boolean {
  if (part.partKind === "profil" || part.partKind === "befestigung") return true;
  if (part.usedOnPartIds?.length || part.parentPartId) return true;
  return false;
}

export function isAssemblyPart(part: Part): boolean {
  if (isComponentPart(part)) return false;
  // Profile hängen am Bezug – nicht an Schaum/Kunststoff/Struktur
  if (part.moduleKind && part.moduleKind !== "bezug") return false;
  return part.partKind === "hauptteil" || part.moduleKind === "bezug" || !part.partKind;
}

/** Komponenten, die an diesem Bezug hängen (inkl. geteilter Profile) */
export function getChildComponents(parts: Part[], assemblyPartId: string): Part[] {
  return parts.filter((p) => getUsedOnPartIds(p).includes(assemblyPartId));
}

/** Alle Assemblierungen, die diese Komponente verwenden */
export function getAssembliesUsing(parts: Part[], componentPartId: string): Part[] {
  const component = parts.find((p) => p.id === componentPartId);
  if (!component) return [];
  const ids = new Set(getUsedOnPartIds(component));
  return parts.filter((p) => ids.has(p.id));
}

export function isSharedComponent(part: Part): boolean {
  return getUsedOnPartIds(part).length > 1;
}

/** Snapshot der Komponenten-Stände vom Vorgänger-Stand (alles carriedOver) */
export function carryOverComponentStands(
  previous: Revision | undefined,
  children: Part[],
): ComponentStandRef[] {
  const prevMap = new Map(
    (previous?.componentStands ?? []).map((c) => [c.partId, c]),
  );
  return children.map((child) => {
    const prev = prevMap.get(child.id);
    return {
      partId: child.id,
      revision: prev?.revision ?? child.currentRevision,
      carriedOver: true,
    };
  });
}

export function applyComponentDecisions(
  base: ComponentStandRef[],
  decisions: { partId: string; carryOver: boolean; nextRevision?: string }[],
): ComponentStandRef[] {
  const byId = new Map(decisions.map((d) => [d.partId, d]));
  return base.map((ref) => {
    const d = byId.get(ref.partId);
    if (!d) return { ...ref, carriedOver: true };
    if (d.carryOver) return { ...ref, carriedOver: true };
    return {
      partId: ref.partId,
      revision: d.nextRevision ?? ref.revision,
      carriedOver: false,
    };
  });
}
