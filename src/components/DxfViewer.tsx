"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { createDemoDxf } from "@/lib/dxf-demo";
import { dxfToSvgPaths } from "@/lib/dxf-to-svg";
import type { Part } from "@/lib/types";

const MAX_CHARS = 800_000;

export type DxfAttachment = {
  fileName: string;
  content: string;
  uploadedAt: string;
};

export function DxfViewerPanel({
  part,
  dxf,
  onChange,
}: {
  part: Part;
  dxf?: DxfAttachment | null;
  onChange: (next: DxfAttachment | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rendered = useMemo(() => {
    if (!dxf?.content) return null;
    try {
      return dxfToSvgPaths(dxf.content);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "DXF konnte nicht gelesen werden." };
    }
  }, [dxf?.content]);

  async function onFile(files: FileList | null) {
    if (!files?.[0]) return;
    setBusy(true);
    setError(null);
    try {
      const file = files[0];
      const text = await file.text();
      if (text.length > MAX_CHARS) {
        throw new Error("DXF zu groß (max. ca. 800 KB Text).");
      }
      // parse probe
      dxfToSvgPaths(text);
      onChange({
        fileName: file.name,
        content: text,
        uploadedAt: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import fehlgeschlagen.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function loadDemo() {
    setError(null);
    const kind =
      part.partKind === "profil" || part.partKind === "befestigung"
        ? "profil"
        : part.moduleKind === "bezug"
          ? "bezug"
          : "sonstig";
    const content = createDemoDxf(part.partNumber, kind);
    onChange({
      fileName: `${part.partNumber}_demo.dxf`,
      content,
      uploadedAt: new Date().toISOString(),
    });
  }

  const pad = 12;
  let viewBox = "0 0 100 100";
  if (rendered && !("error" in rendered)) {
    const w = Math.max(rendered.maxX - rendered.minX, 1);
    const h = Math.max(rendered.maxY - rendered.minY, 1);
    // SVG Y nach unten – DXF Y nach oben → flip
    viewBox = `${rendered.minX - pad} ${-(rendered.maxY + pad)} ${w + pad * 2} ${h + pad * 2}`;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">CAD / DXF (2D)</p>
          <p className="text-xs text-[var(--ink-muted)]">
            Klassische 2D-Zeichnung · DXF laden oder Demo erzeugen
            {dxf ? ` · ${dxf.fileName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".dxf,image/vnd.dxf,application/dxf,text/plain"
            className="hidden"
            onChange={(e) => onFile(e.target.files)}
          />
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Lädt…" : "DXF laden"}
          </Button>
          <Button variant="ghost" onClick={loadDemo}>
            Demo-DXF
          </Button>
          {dxf ? (
            <Button variant="ghost" onClick={() => onChange(undefined)}>
              Entfernen
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mb-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      {rendered && "error" in rendered ? (
        <p className="mb-2 text-sm text-[var(--danger)]">{rendered.error}</p>
      ) : null}

      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[#fbfbfb]">
        {!dxf ? (
          <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-sm text-[var(--ink-muted)]">
              Noch keine DXF an diesem Stand.
            </p>
            <Button variant="secondary" onClick={loadDemo}>
              Demo-Zeichnung erzeugen
            </Button>
          </div>
        ) : rendered && !("error" in rendered) ? (
          <svg
            viewBox={viewBox}
            className="h-auto w-full"
            style={{ maxHeight: 420 }}
            role="img"
            aria-label={`DXF ${dxf.fileName}`}
          >
            <g transform="scale(1,-1)">
              {rendered.paths.map((p, i) => (
                <path
                  key={i}
                  d={p.d}
                  fill="none"
                  stroke="#1a1f24"
                  strokeWidth={0.8}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          </svg>
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center text-sm text-[var(--ink-subtle)]">
            Zeichnung nicht darstellbar.
          </div>
        )}
      </div>
      {rendered && !("error" in rendered) ? (
        <p className="mt-2 text-xs text-[var(--ink-subtle)]">
          {rendered.entityCount} Elemente · 2D-Ansicht (Linien, Polylinien, Kreise, Bögen)
        </p>
      ) : null}
    </div>
  );
}
