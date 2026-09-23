"use client";

import Link from "next/link";
import { Button, PageHeader, Panel, StatusPill } from "@/components/ui";
import { formatDate, taskStatusLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { partPath } from "@/lib/nav";

export default function ExternalPage() {
  const { state, currentUser, updateTask } = useStore();

  const myTasks = state.tasks.filter(
    (t) => t.assigneeId === state.currentUserId || (t.type === "extern" && state.demoRole === "extern"),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Eingeschränkter Zugang"
        title="Externe Aufträge"
        description={
          currentUser
            ? `${currentUser.name}${currentUser.company ? ` · ${currentUser.company}` : ""} – nur freigegebene Informationen.`
            : "Externe Sicht"
        }
      />

      <div className="mb-6 rounded-[var(--radius)] border border-[var(--warn)]/25 bg-[var(--warn-soft)] px-5 py-4 text-sm text-[var(--warn)]">
        Externe sehen keine internen KPIs, Kosten, Mitarbeiterdaten oder anderen Projekte – nur
        zugewiesene Aufträge und freigegebene Dateien.
      </div>

      <div className="grid gap-4">
        {myTasks.length === 0 ? (
          <Panel>
            <p className="text-[var(--ink-muted)]">Keine zugewiesenen Aufträge.</p>
            <p className="mt-2 text-sm text-[var(--ink-subtle)]">
              Rolle „Extern“ wählen und ggf. Max Mustermann als Benutzer setzen.
            </p>
          </Panel>
        ) : (
          myTasks.map((t) => {
            const project = state.projects.find((p) => p.id === t.projectId);
            const part = state.parts.find((p) => p.id === t.partId);
            return (
              <Panel key={t.id} title={t.title}>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[var(--ink-subtle)]">Projekt (freigegeben)</dt>
                    <dd className="font-medium">{project?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-subtle)]">Bauteil / Revision</dt>
                    <dd className="font-medium">
                      {part ? (
                        <Link href={partPath(part.id)} className="hover:text-[var(--accent)]">
                          {part.partNumber} · Rev. {part.currentRevision}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-subtle)]">Deadline</dt>
                    <dd>{formatDate(t.dueDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-subtle)]">Status</dt>
                    <dd>
                      <StatusPill>{taskStatusLabel[t.status]}</StatusPill>
                    </dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <p className="mb-2 text-sm font-medium">Freigegebene Dateien</p>
                  <div className="flex flex-wrap gap-2">
                    {["CAD", "Zeichnung", "Spezifikation"].map((f) => (
                      <span
                        key={f}
                        className="rounded-md border border-[var(--line)] bg-[var(--ok-soft)] px-3 py-1.5 text-sm text-[var(--ok)]"
                      >
                        ✓ {f}
                      </span>
                    ))}
                    {["Interne Kalkulation", "Interner LOP"].map((f) => (
                      <span
                        key={f}
                        className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--ink-subtle)] line-through"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-sm font-medium">Upload-Bereich (Platzhalter)</p>
                  <button
                    type="button"
                    className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--bg-elevated)] py-8 text-sm text-[var(--ink-subtle)]"
                  >
                    CAD / STEP / Fotos / Messprotokoll hochladen
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      updateTask(t.id, { status: "zur_pruefung", progress: 100 })
                    }
                  >
                    Zur internen Prüfung einreichen
                  </Button>
                  <Button variant="secondary">Rückfrage stellen</Button>
                </div>
              </Panel>
            );
          })
        )}
      </div>
    </div>
  );
}
