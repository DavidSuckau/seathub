"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LopPhotoGallery } from "@/components/LopPhotoGallery";
import { Button, Field, PageHeader, Panel, StatusPill, inputClass } from "@/components/ui";
import {
  formatDateTime,
  lopSourceLabel,
  lopStatusLabel,
} from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { LopStatus } from "@/lib/types";

const statuses = Object.keys(lopStatusLabel) as LopStatus[];

export default function LopDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    state,
    takeOverLop,
    updateLop,
    addLopHistory,
    getProject,
    getPart,
    getUser,
    currentUser,
  } = useStore();
  const lop = state.lops.find((l) => l.id === params.id);

  const [entryAction, setEntryAction] = useState("");
  const [entryDetail, setEntryDetail] = useState("");

  if (!lop) {
    return (
      <div>
        <PageHeader title="LOP nicht gefunden" />
        <Link href="/lops">Zurück</Link>
      </div>
    );
  }

  const project = getProject(lop.projectId);
  const part = lop.partId ? getPart(lop.partId) : undefined;
  const creator = getUser(lop.createdByUserId);
  const takenBy = lop.takenOverByUserId ? getUser(lop.takenOverByUserId) : undefined;
  const sub = state.substitutions.find(
    (s) => s.substituteUserId === state.currentUserId || s.absentUserId === state.currentUserId,
  );
  const photos = lop.photos ?? [];
  const history = [...(lop.history ?? [])].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  function submitEntry() {
    if (!entryAction.trim()) return;
    addLopHistory(lop!.id, entryAction, entryDetail);
    setEntryAction("");
    setEntryDetail("");
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Quelle: ${lopSourceLabel[lop.source]}`}
        title={lop.title}
        description={lop.description}
        actions={
          <Link href="/lops">
            <Button variant="secondary">Alle LOPs</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Panel title="Chronik">
            <p className="mb-4 text-sm text-[var(--ink-muted)]">
              Alles wird dokumentiert: wer was gemacht oder geändert hat. Es gibt keine
              Pflichtschritte – Einträge nach Bedarf.
            </p>

            <ol className="relative ml-2 space-y-0 border-l border-[var(--line-strong)]">
              {history.length === 0 ? (
                <li className="pb-2 pl-6 text-sm text-[var(--ink-subtle)]">Noch keine Einträge.</li>
              ) : (
                history.map((h) => {
                  const actor = getUser(h.actorUserId);
                  return (
                    <li key={h.id} className="relative pb-5 pl-6 last:pb-0">
                      <span className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--accent)] bg-[var(--surface)]" />
                      <p className="font-medium text-[var(--ink)]">{h.action}</p>
                      {h.detail ? (
                        <p className="mt-0.5 text-sm text-[var(--ink-muted)]">{h.detail}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-[var(--ink-subtle)]">
                        {actor?.name ?? "Unbekannt"} · {formatDateTime(h.at)}
                      </p>
                    </li>
                  );
                })
              )}
            </ol>

            <div className="mt-6 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] p-4">
              <p className="mb-3 text-sm font-medium text-[var(--ink)]">
                Eintrag hinzufügen
                {currentUser ? (
                  <span className="font-normal text-[var(--ink-subtle)]">
                    {" "}
                    · als {currentUser.name}
                  </span>
                ) : null}
              </p>
              <div className="grid gap-3">
                <Field label="Was wurde gemacht?">
                  <input
                    className={inputClass}
                    value={entryAction}
                    onChange={(e) => setEntryAction(e.target.value)}
                    placeholder="z. B. Kommentar, Schnitt angepasst, Muster genäht …"
                  />
                </Field>
                <Field label="Details (optional)">
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={entryDetail}
                    onChange={(e) => setEntryDetail(e.target.value)}
                    placeholder="Kurzbeschreibung der Änderung"
                  />
                </Field>
                <div>
                  <Button onClick={submitEntry} disabled={!entryAction.trim()}>
                    Dokumentieren
                  </Button>
                </div>
              </div>
            </div>

            {sub && !lop.takenOverByUserId ? (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => takeOverLop(lop.id, state.currentUserId)}
                >
                  Als Vertretung übernehmen
                </Button>
              </div>
            ) : null}
            {takenBy && lop.takenOverAt ? (
              <p className="mt-4 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">
                Übernommen von {takenBy.name} am {formatDateTime(lop.takenOverAt)}.
              </p>
            ) : null}
          </Panel>

          <Panel title="Fotos">
            <LopPhotoGallery
              photos={photos}
              editable
              onChange={(next) => updateLop(lop.id, { photos: next })}
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Zuordnung">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[var(--ink-subtle)]">Status</dt>
                <dd className="mt-1">
                  <select
                    className={inputClass}
                    value={lop.status}
                    onChange={(e) =>
                      updateLop(lop.id, { status: e.target.value as LopStatus })
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {lopStatusLabel[s]}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-[var(--ink-subtle)]">
                    Statuswechsel wird in der Chronik vermerkt.
                  </p>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Aktueller Status</dt>
                <dd className="mt-1">
                  <StatusPill tone={lop.status === "geschlossen" ? "ok" : "warn"}>
                    {lopStatusLabel[lop.status]}
                  </StatusPill>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Projekt</dt>
                <dd className="mt-1 font-medium">
                  <Link href={`/projects/${project?.id}`}>{project?.name}</Link>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Bauteil</dt>
                <dd className="mt-1 font-medium">
                  {part ? (
                    <Link href={`/parts/${part.id}`}>
                      {part.partNumber} – {part.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Erstellt von</dt>
                <dd className="mt-1">{creator?.name}</dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Beteiligte</dt>
                <dd className="mt-1">
                  {lop.assigneeIds.map((id) => getUser(id)?.name).filter(Boolean).join(", ")}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-subtle)]">Fotos</dt>
                <dd className="mt-1">{photos.length}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
