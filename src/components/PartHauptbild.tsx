"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { isPhotoDataUrl, readImageFile } from "@/components/LopPhotoGallery";
import { partImageSrc, pickDemoPartImage } from "@/lib/part-images";
import type { Part } from "@/lib/types";

export function PartImageThumb({
  part,
  className = "",
  size = "md",
}: {
  part: Pick<Part, "imageUrl" | "name" | "partKind" | "moduleKind" | "componentRole">;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "sm"
      ? "h-10 w-10"
      : size === "lg"
        ? "h-16 w-20"
        : "h-12 w-14";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={partImageSrc(part)}
      alt=""
      className={`${dims} shrink-0 rounded-[var(--radius)] object-cover ${className}`}
    />
  );
}

export function PartHauptbild({
  part,
  onChange,
}: {
  part: Part;
  onChange: (imageUrl: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const custom = Boolean(part.imageUrl?.startsWith("data:image/"));

  async function onFile(files: FileList | null) {
    if (!files?.[0]) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await readImageFile(files[0]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mb-6 overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)]">
      <div className="relative aspect-[16/9] max-h-[320px] w-full bg-[var(--bg)] sm:aspect-[21/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={partImageSrc(part)}
          alt={`Hauptbild ${part.name}`}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] px-4 py-3">
        <div>
          <p className="text-sm font-medium">Hauptbild</p>
          <p className="text-xs text-[var(--ink-muted)]">
            {custom ? "Eigenes Foto" : "Demo-Beispiel · kann ersetzt werden"}
          </p>
          {error ? <p className="mt-1 text-xs text-[var(--danger)]">{error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files)}
          />
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Lädt…" : "Bild ersetzen"}
          </Button>
          {custom || (part.imageUrl && isPhotoDataUrl(part.imageUrl)) ? (
            <Button
              variant="ghost"
              onClick={() => onChange(pickDemoPartImage(part))}
            >
              Demo wiederherstellen
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
