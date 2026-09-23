/** Erzeugt eine einfache klassische 2D-DXF (Sitz-/Profil-Umriss) für die Demo. */
export function createDemoDxf(partNumber: string, kind: "bezug" | "profil" | "sonstig" = "sonstig"): string {
  const label = partNumber.replace(/"/g, "");
  const shapes =
    kind === "profil"
      ? profilEntities()
      : kind === "bezug"
        ? bezugEntities()
        : genericEntities();

  return [
    "0",
    "SECTION",
    "2",
    "HEADER",
    "9",
    "$ACADVER",
    "1",
    "AC1015",
    "0",
    "ENDSEC",
    "0",
    "SECTION",
    "2",
    "ENTITIES",
    ...shapes,
    // Titeltext
    "0",
    "TEXT",
    "8",
    "0",
    "10",
    "10",
    "20",
    "-25",
    "30",
    "0",
    "40",
    "8",
    "1",
    label,
    "0",
    "ENDSEC",
    "0",
    "EOF",
    "",
  ].join("\n");
}

function line(x1: number, y1: number, x2: number, y2: number): string[] {
  return [
    "0",
    "LINE",
    "8",
    "0",
    "10",
    String(x1),
    "20",
    String(y1),
    "30",
    "0",
    "11",
    String(x2),
    "21",
    String(y2),
    "31",
    "0",
  ];
}

function lwpoly(points: [number, number][], closed = true): string[] {
  const out = [
    "0",
    "LWPOLYLINE",
    "8",
    "0",
    "90",
    String(points.length),
    "70",
    closed ? "1" : "0",
  ];
  for (const [x, y] of points) {
    out.push("10", String(x), "20", String(y));
  }
  return out;
}

function circle(cx: number, cy: number, r: number): string[] {
  return [
    "0",
    "CIRCLE",
    "8",
    "0",
    "10",
    String(cx),
    "20",
    String(cy),
    "30",
    "0",
    "40",
    String(r),
  ];
}

function bezugEntities(): string[] {
  // Sitzfläche-ähnlich + Lehnenkontur (2D)
  return [
    ...lwpoly([
      [40, 40],
      [200, 30],
      [240, 80],
      [230, 160],
      [180, 190],
      [60, 185],
      [20, 130],
    ]),
    ...lwpoly([
      [60, 190],
      [180, 195],
      [200, 260],
      [160, 300],
      [80, 295],
      [45, 240],
    ]),
    ...line(100, 50, 95, 170),
    ...line(140, 45, 140, 175),
    ...line(180, 55, 175, 170),
    ...circle(120, 100, 4),
  ];
}

function profilEntities(): string[] {
  return [
    ...lwpoly([
      [20, 40],
      [280, 40],
      [280, 55],
      [20, 55],
    ]),
    ...lwpoly(
      [
        [30, 70],
        [270, 70],
        [270, 82],
        [30, 82],
      ],
      true,
    ),
    ...line(40, 40, 40, 55),
    ...line(140, 40, 140, 55),
    ...line(240, 40, 240, 55),
    ...circle(50, 47.5, 3),
    ...circle(250, 47.5, 3),
  ];
}

function genericEntities(): string[] {
  return [
    ...lwpoly([
      [30, 30],
      [180, 30],
      [180, 140],
      [30, 140],
    ]),
    ...line(30, 30, 180, 140),
    ...line(180, 30, 30, 140),
    ...circle(105, 85, 20),
  ];
}
