import type {
  ModuleKind,
  Part,
  PartSide,
  StructureNode,
  StructureNodeType,
  SupplyScope,
} from "./types";

export const structureTypeLabel: Record<StructureNodeType, string> = {
  sitzreihe: "Sitzreihe",
  sitzvariante: "Sitzart",
  bezugvariante: "Bezugvariante",
  modul: "Modul",
};

export const moduleKindLabel: Record<ModuleKind, string> = {
  bezug: "Bezug",
  schnittstelle: "Anbindung",
  struktur: "Struktur",
  kunststoff: "Kunststoff",
  metall: "Metall",
  schaum: "Schaum",
  profil: "Profil",
};

export const supplyScopeLabel: Record<SupplyScope, string> = {
  bezug: "Nur Bezug",
  bezug_schnittstelle: "Bezug + Anbindung",
  komplettsitz: "Komplettsitz",
};

export const supplyScopeHint: Record<SupplyScope, string> = {
  bezug: "Nur Bezüge werden entwickelt und dokumentiert.",
  bezug_schnittstelle:
    "Bezüge plus dokumentierte Anbindung an Kunststoff oder Struktur – ohne eigene Entwicklung dieser Module.",
  komplettsitz:
    "Bezug sowie eigene Struktur-, Kunststoff-, Schaum- und/oder Metall-Bauteile.",
};

/** Typische Ausstattungsmerkmale bei Programm-Anlage (Bezüge / Schaum) */
export const EQUIPMENT_OPTIONS = [
  { id: "sitzheizung", label: "Sitzheizung" },
  { id: "sitzlueftung", label: "Sitzlüftung" },
  { id: "massage", label: "Massage" },
  { id: "memory", label: "Memory" },
  { id: "airbag", label: "Seitenairbag im Sitz" },
  { id: "lordose", label: "Lordosenstütze" },
  { id: "durchlade", label: "Durchlade / Armlehne" },
] as const;

export const equipmentLabel = Object.fromEntries(
  EQUIPMENT_OPTIONS.map((o) => [o.id, o.label]),
) as Record<string, string>;

export function equipmentLabels(ids: string[] | undefined): string[] {
  if (!ids?.length) return [];
  return ids.map((id) => equipmentLabel[id] ?? id);
}

export const sideLabel: Record<PartSide, string> = {
  links: "Links",
  rechts: "Rechts",
  mitte: "Mitte",
  einzeln: "Einzeln",
};

export const developmentRoleLabel: Record<string, string> = {
  entwickelt: "Wird entwickelt",
  spiegel: "Spiegel / Kopie",
  eigenstaendig: "Eigenständig (L≠R)",
};

export function getChildren(
  nodes: StructureNode[],
  projectId: string,
  parentId: string | null,
): StructureNode[] {
  return nodes
    .filter((n) => n.projectId === projectId && n.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getNodePath(nodes: StructureNode[], nodeId: string | undefined): StructureNode[] {
  if (!nodeId) return [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const path: StructureNode[] = [];
  let cur: StructureNode | undefined = byId.get(nodeId);
  while (cur) {
    path.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return path;
}

export function partPathLabel(nodes: StructureNode[], part: Part): string {
  const path = getNodePath(nodes, part.structureNodeId);
  const bits = path.map((n) => n.label);
  if (part.side) bits.push(sideLabel[part.side]);
  return bits.join(" · ");
}

export function countPartsUnderNode(
  nodes: StructureNode[],
  parts: Part[],
  nodeId: string,
): number {
  const ids = new Set<string>([nodeId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of nodes) {
      if (n.parentId && ids.has(n.parentId) && !ids.has(n.id)) {
        ids.add(n.id);
        changed = true;
      }
    }
  }
  return parts.filter((p) => p.structureNodeId && ids.has(p.structureNodeId)).length;
}

/** Pair master+mirror for display; standalone and unpaired alone */
export function groupPartsForDisplay(parts: Part[]): { primary: Part; mirror?: Part }[] {
  const used = new Set<string>();
  const groups: { primary: Part; mirror?: Part }[] = [];
  const byId = new Map(parts.map((p) => [p.id, p]));

  for (const p of parts) {
    if (used.has(p.id)) continue;
    if (p.developmentRole === "spiegel" && p.mirrorMasterPartId) {
      const master = byId.get(p.mirrorMasterPartId);
      if (master && !used.has(master.id)) {
        used.add(master.id);
        used.add(p.id);
        groups.push({ primary: master, mirror: p });
        continue;
      }
    }
    if (p.mirrorPairPartId) {
      const pair = byId.get(p.mirrorPairPartId);
      if (pair && !used.has(pair.id)) {
        used.add(p.id);
        used.add(pair.id);
        const primary = p.developmentRole === "spiegel" ? pair : p;
        const mirror = primary.id === p.id ? pair : p;
        groups.push({ primary, mirror });
        continue;
      }
    }
    used.add(p.id);
    groups.push({ primary: p });
  }
  return groups;
}
