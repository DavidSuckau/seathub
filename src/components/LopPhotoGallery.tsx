"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";

const MAX_BYTES = 700_000;
const MAX_PHOTOS = 8;

export function isPhotoDataUrl(value: string): boolean {
  return value.startsWith("data:image/");
}

export async function readImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Nur Bilddateien (JPG, PNG, …).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Bild zu groß (max. ca. 700 KB).");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

export function LopPhotoGallery({
  photos,
  onChange,
  editable = false,
}: {
  photos: string[];
  onChange?: (next: string[]) => void;
  editable?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files || !onChange) return;
    setError(null);
    setBusy(true);
    try {
      const next = [...photos];
      for (const file of Array.from(files)) {
        if (next.length >= MAX_PHOTOS) {
          setError(`Maximal ${MAX_PHOTOS} Fotos.`);
          break;
        }
        next.push(await readImageFile(file));
      }
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    if (!onChange) return;
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div>
      {photos.length === 0 ? (
        <p className="text-sm text-[var(--ink-subtle)]">Keine Fotos angehängt.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((ph, i) => (
            <div
              key={`${i}-${ph.slice(0, 24)}`}
              className="group relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)]"
            >
              {isPhotoDataUrl(ph) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ph} alt={`LOP-Foto ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center p-2 text-center text-xs text-[var(--ink-subtle)]">
                  {ph}
                </div>
              )}
              {editable ? (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute right-1.5 top-1.5 rounded bg-[var(--ink)]/75 px-2 py-0.5 text-[11px] text-white opacity-0 transition group-hover:opacity-100"
                >
                  Entfernen
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {editable ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void onFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={busy || photos.length >= MAX_PHOTOS}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Lade…" : "Fotos anhängen"}
          </Button>
          <span className="text-xs text-[var(--ink-subtle)]">
            {photos.length}/{MAX_PHOTOS} · JPG/PNG, max. ~700 KB
          </span>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
