import DxfParser from "dxf-parser";

export type DxfSvgPath = {
  d: string;
  kind: "line" | "poly" | "circle" | "arc";
};

export type DxfRenderResult = {
  paths: DxfSvgPath[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  entityCount: number;
};

type Pt = { x: number; y: number };

function expandBBox(
  box: { minX: number; minY: number; maxX: number; maxY: number },
  x: number,
  y: number,
) {
  box.minX = Math.min(box.minX, x);
  box.minY = Math.min(box.minY, y);
  box.maxX = Math.max(box.maxX, x);
  box.maxY = Math.max(box.maxY, y);
}

function polyPath(points: Pt[], closed: boolean): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) d += ` L ${p.x} ${p.y}`;
  if (closed) d += " Z";
  return d;
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  let start = startDeg;
  let end = endDeg;
  let delta = end - start;
  while (delta <= 0) delta += 360;
  const large = delta > 180 ? 1 : 0;
  const x1 = cx + r * Math.cos(toRad(start));
  const y1 = cy + r * Math.sin(toRad(start));
  const x2 = cx + r * Math.cos(toRad(end));
  const y2 = cy + r * Math.sin(toRad(end));
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

/** Parst DXF-Text und liefert SVG-Pfade (klassisch 2D). */
export function dxfToSvgPaths(dxfText: string): DxfRenderResult {
  const parser = new DxfParser();
  const dxf = parser.parseSync(dxfText);
  if (!dxf?.entities?.length) {
    throw new Error("Keine 2D-Elemente in der DXF gefunden.");
  }

  const paths: DxfSvgPath[] = [];
  const box = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  for (const e of dxf.entities as unknown as Array<Record<string, unknown>>) {
    const type = String(e.type ?? "");

    if (type === "LINE") {
      const verts = (e.vertices as Pt[] | undefined) ?? [];
      if (verts.length < 2) continue;
      const [start, end] = verts;
      expandBBox(box, start.x, start.y);
      expandBBox(box, end.x, end.y);
      paths.push({
        d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        kind: "line",
      });
      continue;
    }

    if (type === "LWPOLYLINE" || type === "POLYLINE") {
      const verts = (e.vertices as Pt[] | undefined) ?? [];
      if (verts.length < 2) continue;
      for (const v of verts) expandBBox(box, v.x, v.y);
      const closed = Boolean(e.shape) || (Number(e.flags ?? 0) & 1) === 1;
      paths.push({ d: polyPath(verts, closed), kind: "poly" });
      continue;
    }

    if (type === "CIRCLE") {
      const c = e.center as Pt | undefined;
      const r = Number(e.radius ?? 0);
      if (!c || r <= 0) continue;
      expandBBox(box, c.x - r, c.y - r);
      expandBBox(box, c.x + r, c.y + r);
      paths.push({
        d: [
          `M ${c.x - r} ${c.y}`,
          `A ${r} ${r} 0 1 0 ${c.x + r} ${c.y}`,
          `A ${r} ${r} 0 1 0 ${c.x - r} ${c.y}`,
        ].join(" "),
        kind: "circle",
      });
      continue;
    }

    if (type === "ARC") {
      const c = e.center as Pt | undefined;
      const r = Number(e.radius ?? 0);
      const start = Number(e.startAngle ?? 0);
      const end = Number(e.endAngle ?? 0);
      if (!c || r <= 0) continue;
      expandBBox(box, c.x - r, c.y - r);
      expandBBox(box, c.x + r, c.y + r);
      paths.push({
        d: arcPath(c.x, c.y, r, start, end),
        kind: "arc",
      });
    }
  }

  if (!paths.length || !Number.isFinite(box.minX)) {
    throw new Error("Keine darstellbaren 2D-Linien in der DXF.");
  }

  return {
    paths,
    minX: box.minX,
    minY: box.minY,
    maxX: box.maxX,
    maxY: box.maxY,
    entityCount: paths.length,
  };
}
