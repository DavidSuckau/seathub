import type { Material, MaterialArt, MaterialEinheit } from "./types";

export const materialArtLabel: Record<MaterialArt, string> = {
  leder: "Leder",
  stoff: "Stoff",
  alcantara: "Alcantara",
  kunstleder: "Kunstleder",
  schaum: "Schaum",
  garn: "Garn",
  profil: "Profil",
  clip: "Clip / Befestigung",
  klebstoff: "Klebstoff",
  vlies: "Vlies",
  sonstig: "Sonstig",
};

export const materialArts: MaterialArt[] = [
  "leder",
  "stoff",
  "alcantara",
  "kunstleder",
  "schaum",
  "garn",
  "profil",
  "clip",
  "klebstoff",
  "vlies",
  "sonstig",
];

export const materialEinheiten: MaterialEinheit[] = [
  "Stk",
  "m",
  "m²",
  "kg",
  "Rolle",
  "Paar",
  "Set",
];

export function formatMaterialPrice(preis: number, einheit: MaterialEinheit): string {
  return `${preis.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  })} / ${einheit}`;
}

export function formatStock(verfuegbar: number, einheit: MaterialEinheit): string {
  const n = Number.isInteger(verfuegbar)
    ? String(verfuegbar)
    : verfuegbar.toLocaleString("de-DE", { maximumFractionDigits: 2 });
  return `${n} ${einheit}`;
}

export function stockTone(
  verfuegbar: number,
): "ok" | "watch" | "warn" | "neutral" {
  if (verfuegbar <= 0) return "warn";
  if (verfuegbar < 10) return "watch";
  return "ok";
}

/** Demo-Materialstammdaten */
export function createDemoMaterials(): Material[] {
  return [
    {
      id: "mat-alc-a",
      kaufnummer: "MAT-ALC-2100",
      beschreibung: "Alcantara Anthrazit Bezugsqualität",
      art: "alcantara",
      einheit: "m",
      preis: 48.5,
      lieferant: "Alcantara S.p.A.",
      lagerplatz: "H-A-12",
      verfuegbar: 86,
    },
    {
      id: "mat-led-nappa",
      kaufnummer: "MAT-LED-4410",
      beschreibung: "Nappa Leder schwarz, automotive",
      art: "leder",
      einheit: "m²",
      preis: 72.0,
      lieferant: "Boxmark Leather",
      lagerplatz: "H-B-03",
      verfuegbar: 42,
    },
    {
      id: "mat-stf-b",
      kaufnummer: "MAT-STF-118",
      beschreibung: "Bezugsstoff Serie B grau",
      art: "stoff",
      einheit: "m",
      preis: 18.9,
      lieferant: "Borgers SE",
      lagerplatz: "H-A-08",
      verfuegbar: 210,
    },
    {
      id: "mat-garn-30",
      kaufnummer: "MAT-GAR-30",
      beschreibung: "Nähgarn PES 30, schwarz",
      art: "garn",
      einheit: "Rolle",
      preis: 4.2,
      lieferant: "Amann Group",
      lagerplatz: "H-C-01",
      verfuegbar: 340,
    },
    {
      id: "mat-garn-y",
      kaufnummer: "MAT-GAR-Y",
      beschreibung: "Nähgarn Kontrast Doppelnaht",
      art: "garn",
      einheit: "Rolle",
      preis: 5.1,
      lieferant: "Amann Group",
      lagerplatz: "H-C-02",
      verfuegbar: 28,
    },
    {
      id: "mat-schaum-sitz",
      kaufnummer: "MAT-SCH-SITZ",
      beschreibung: "PUR-Schaum Sitzform Rohling",
      art: "schaum",
      einheit: "Stk",
      preis: 38.0,
      lieferant: "Recticel",
      lagerplatz: "R-01-A",
      verfuegbar: 16,
    },
    {
      id: "mat-okr-a",
      kaufnummer: "MAT-OKR-A",
      beschreibung: "OKR-Kurzschlussprofil Typ A",
      art: "profil",
      einheit: "m",
      preis: 12.4,
      lieferant: "TrimTech GmbH",
      lagerplatz: "H-D-05",
      verfuegbar: 120,
    },
    {
      id: "mat-clip-set",
      kaufnummer: "MAT-CLIP-01",
      beschreibung: "Clip-Set Bezug / Kunststoffschale",
      art: "clip",
      einheit: "Set",
      preis: 2.85,
      lieferant: "A. Raymond",
      lagerplatz: "H-E-11",
      verfuegbar: 8,
    },
    {
      id: "mat-vlies",
      kaufnummer: "MAT-VLI-40",
      beschreibung: "Verstärkungsvlies 40 g/m²",
      art: "vlies",
      einheit: "m",
      preis: 3.6,
      lieferant: "Freudenberg",
      lagerplatz: "H-A-22",
      verfuegbar: 0,
    },
    {
      id: "mat-kleb",
      kaufnummer: "MAT-KLE-SPRAY",
      beschreibung: "Bezugs-Spraykleber",
      art: "klebstoff",
      einheit: "Stk",
      preis: 14.9,
      lieferant: "3M",
      lagerplatz: "H-F-02",
      verfuegbar: 22,
    },
  ];
}
