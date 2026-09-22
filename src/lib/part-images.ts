import { withBasePath } from "./nav";
import type { Part, PartKind } from "./types";

/** Demo-Hauptbilder unter /public/parts */
export const PART_DEMO_IMAGES = {
  alcantara: "/parts/demo-alcantara.png",
  leder: "/parts/demo-leder.png",
  stoff: "/parts/demo-stoff.png",
  kunstleder: "/parts/demo-kunstleder.png",
  profil: "/parts/demo-profil.png",
  schaum: "/parts/demo-schaum.png",
  kunststoff: "/parts/demo-kunststoff.png",
  struktur: "/parts/demo-struktur.png",
  befestigung: "/parts/demo-befestigung.png",
} as const;

export type PartDemoImageKey = keyof typeof PART_DEMO_IMAGES;

export function pickDemoPartImage(
  part: Pick<Part, "name" | "partKind" | "moduleKind" | "componentRole">,
): string {
  const hay = `${part.name} ${part.componentRole ?? ""} ${part.moduleKind ?? ""}`.toLowerCase();

  if (hay.includes("alcantara")) return PART_DEMO_IMAGES.alcantara;
  if (hay.includes("kunstleder")) return PART_DEMO_IMAGES.kunstleder;
  if (hay.includes("leder")) return PART_DEMO_IMAGES.leder;
  if (hay.includes("stoff")) return PART_DEMO_IMAGES.stoff;
  if (
    hay.includes("schaum") ||
    part.partKind === "schaum" ||
    part.moduleKind === "schaum"
  ) {
    return PART_DEMO_IMAGES.schaum;
  }
  if (
    hay.includes("kunststoff") ||
    hay.includes("schale") ||
    part.moduleKind === "kunststoff" ||
    part.moduleKind === "schnittstelle"
  ) {
    return PART_DEMO_IMAGES.kunststoff;
  }
  if (
    hay.includes("struktur") ||
    hay.includes("frame") ||
    hay.includes("metall") ||
    part.moduleKind === "struktur"
  ) {
    return PART_DEMO_IMAGES.struktur;
  }
  if (part.partKind === "befestigung" || hay.includes("clip") || hay.includes("draht")) {
    return PART_DEMO_IMAGES.befestigung;
  }
  if (part.partKind === "profil" || hay.includes("profil") || hay.includes("okr")) {
    return PART_DEMO_IMAGES.profil;
  }

  const byKind: Partial<Record<PartKind, string>> = {
    hauptteil: PART_DEMO_IMAGES.leder,
    profil: PART_DEMO_IMAGES.profil,
    befestigung: PART_DEMO_IMAGES.befestigung,
    schaum: PART_DEMO_IMAGES.schaum,
    sonstig: PART_DEMO_IMAGES.profil,
  };
  return byKind[part.partKind ?? "hauptteil"] ?? PART_DEMO_IMAGES.leder;
}

/** Gespeicherter Pfad/URL ohne basePath. */
export function partImageUrl(
  part: Pick<Part, "imageUrl" | "name" | "partKind" | "moduleKind" | "componentRole">,
): string {
  return part.imageUrl?.trim() || pickDemoPartImage(part);
}

/** Für <img src> inkl. GitHub-Pages-basePath. */
export function partImageSrc(
  part: Pick<Part, "imageUrl" | "name" | "partKind" | "moduleKind" | "componentRole">,
): string {
  const url = partImageUrl(part);
  if (url.startsWith("data:") || /^https?:\/\//i.test(url)) return url;
  return withBasePath(url);
}

export function withDemoPartImages<T extends Part>(parts: T[]): T[] {
  return parts.map((p) => ({
    ...p,
    imageUrl: p.imageUrl?.trim() || pickDemoPartImage(p),
  }));
}
