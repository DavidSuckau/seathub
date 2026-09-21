"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  type ArtFilter,
  ModuleKindFilter,
  partMatchesArt,
} from "@/components/ModuleKindFilter";
import { PageHeader, Panel, StatusPill } from "@/components/ui";
import { locationLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { DepartmentId, ModuleKind } from "@/lib/types";

const DEPT_ORDER: DepartmentId[] = [
  "trim-engineering",
  "engineering",
  "schnittentwicklung",
  "cad",
  "naeherei",
  "zuschnitt",
  "polsterei",
  "musterbau",
  "dokumentation",
  "werke",
  "support",
  "ausbildung",
];

const DONE = new Set(["abgeschlossen", "erledigt", "gestoppt"]);

export default function DepartmentsPage() {
  const { state, currentUser } = useStore();
  const myDeptId = currentUser?.departmentId;
  const [artFilter, setArtFilter] = useState<ArtFilter>("alle");

  const availableArts = useMemo(() => {
    const set = new Set<ModuleKind>();
    for (const t of state.tasks) {
      const part = state.parts.find((p) => p.id === t.partId);
      if (part?.moduleKind) set.add(part.moduleKind);
    }
    return Array.from(set);
  }, [state.tasks, state.parts]);

  const depts = DEPT_ORDER.map((id) => state.departments.find((d) => d.id === id)).filter(
    Boolean,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Organisation"
        title="Abteilungs-Dashboards"
        description="Gesamtbild je Abteilung: Aufträge, Zuweisungen, LOPs, Team und Auslastung."
      />

      {state.demoRole !== "manager" && myDeptId ? (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Deine persönlichen Aufträge liegen unter{" "}
          <Link href="/dashboard" className="font-medium text-[var(--accent)] hover:underline">
            Mein Tag
          </Link>
          . Hier der Überblick für Teamleitung –{" "}
          <Link
            href={`/departments/${myDeptId}`}
            className="font-medium text-[var(--accent)] hover:underline"
          >
            direkt zu deiner Abteilung
          </Link>
          .
        </div>
      ) : null}

      <div className="mb-6">
        <ModuleKindFilter
          value={artFilter}
          onChange={setArtFilter}
          available={availableArts}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {depts.map((dept) => {
          if (!dept) return null;
          const people = state.users.filter(
            (u) => u.departmentId === dept.id && u.demoRole !== "extern",
          );
          const tasks = state.tasks.filter((t) => {
            if (t.departmentId !== dept.id) return false;
            if (artFilter === "alle") return true;
            const part = state.parts.find((p) => p.id === t.partId);
            return part ? partMatchesArt(part, artFilter) : false;
          });
          const open = tasks.filter((t) => !DONE.has(t.status));
          const waiting = open.filter((t) => t.needsAssignment || !t.assigneeId);
          const critical = open.filter((t) => t.priority === "kritisch" || t.risk === "rot");
          const lops = state.lops.filter(
            (l) =>
              l.departmentIds.includes(dept.id) &&
              l.status !== "geschlossen",
          );
          const isMine = dept.id === myDeptId;

          return (
            <Link
              key={dept.id}
              href={`/departments/${dept.id}`}
              className={`block rounded-[var(--radius-lg)] border bg-[var(--surface)] p-5 shadow-[var(--shadow)] transition hover:border-[var(--accent)] ${
                isMine
                  ? "border-[var(--accent)] ring-1 ring-[var(--accent)]/20"
                  : "border-[var(--line)]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
                    {dept.location ? locationLabel[dept.location] : "—"}
                  </p>
                  <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-[var(--ink)]">
                    {dept.name}
                  </h2>
                </div>
                {isMine ? <StatusPill tone="accent">Meine</StatusPill> : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[var(--ink-subtle)]">Offen</p>
                  <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    {open.length}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--ink-subtle)]">Zuweisung</p>
                  <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    {waiting.length}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--ink-subtle)]">Kritisch</p>
                  <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    {critical.length}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--ink-subtle)]">LOPs</p>
                  <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    {lops.length}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-[var(--ink-muted)]">
                {people.length} Personen · Auslastung {dept.capacityPercent} %
              </p>
            </Link>
          );
        })}
      </div>

      <Panel className="mt-6" title="Hinweis">
        <p className="text-sm text-[var(--ink-muted)]">
          Filter nach Art wirkt auf die Auftrag-Zahlen der Kacheln. Im Abteilungs-Dashboard siehst
          du alle Aufträge der Abteilung – ideal für Teamleitung.
        </p>
      </Panel>
    </div>
  );
}
