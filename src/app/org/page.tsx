"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, Panel, StatusPill } from "@/components/ui";
import {
  departmentCapacityFromTasks,
  personCapacityFromTasks,
} from "@/lib/capacity";
import { locationLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { DepartmentId, LocationId, User } from "@/lib/types";

const SITE_ORDER: LocationId[] = ["hannover", "rumaenien"];

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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className={`shrink-0 text-[var(--ink-subtle)] transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
      {initials}
    </span>
  );
}

function CountBadge({ n, label = "Einträge" }: { n: number; label?: string }) {
  return (
    <span className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
      {n} {label}
    </span>
  );
}

export default function OrgPage() {
  const { state, setCurrentUserId } = useStore();
  const [openRoot, setOpenRoot] = useState(true);
  const [openSites, setOpenSites] = useState<Record<string, boolean>>({
    hannover: true,
    rumaenien: true,
  });
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const leader = state.users.find((u) => u.id === "u-frank") ?? state.users[0];

  const tree = useMemo(() => {
    return SITE_ORDER.map((site) => {
      const siteUsers = state.users.filter(
        (u) => u.location === site && u.departmentId !== "extern",
      );
      const depts = DEPT_ORDER.map((deptId) => {
        const dept = state.departments.find((d) => d.id === deptId);
        const people = siteUsers.filter((u) => u.departmentId === deptId);
        return { dept, people };
      }).filter((d) => d.dept && d.people.length > 0);

      return {
        site,
        peopleCount: siteUsers.length,
        depts,
      };
    });
  }, [state.users, state.departments]);

  const externUsers = state.users.filter((u) => u.location === "extern");
  const selectedUser = selectedUserId
    ? state.users.find((u) => u.id === selectedUserId)
    : null;

  function toggleDept(key: string) {
    setOpenDepts((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function selectPerson(user: User) {
    setSelectedUserId(user.id);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Struktur"
        title="Organisation"
        description="Komplettsitzleitung → Standorte → Abteilungen → Mitarbeiter. Aufklappen und Personen auswählen."
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <Panel flush className="overflow-hidden">
          <div className="border-b border-[var(--line)] px-5 py-3">
            <h2 className="text-[15px] font-semibold">Organisationsbaum</h2>
          </div>

          <div className="p-3 sm:p-4">
            {/* Root: Komplettsitzleiter */}
            <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)]">
              <button
                type="button"
                onClick={() => setOpenRoot((v) => !v)}
                className="org-node flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-3 text-left"
              >
                <Chevron open={openRoot} />
                <Avatar name={leader?.name ?? "KL"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ink)]">
                    Komplettsitzleitung
                  </p>
                  <p className="truncate text-xs text-[var(--ink-muted)]">
                    {leader?.name} · {leader?.roleLabel}
                  </p>
                </div>
                <CountBadge n={state.users.filter((u) => u.location !== "extern").length} />
              </button>

              {openRoot ? (
                <div className="border-t border-[var(--line)] px-2 pb-2 pt-1">
                  {tree.map((branch) => {
                    const siteOpen = openSites[branch.site] ?? false;
                    return (
                      <div key={branch.site} className="relative ml-3 border-l border-[var(--line)] pl-3">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSites((prev) => ({
                              ...prev,
                              [branch.site]: !siteOpen,
                            }))
                          }
                          className="org-node mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left"
                        >
                          <Chevron open={siteOpen} />
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                            {branch.site === "hannover" ? "HA" : "RO"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{locationLabel[branch.site]}</p>
                            <p className="text-xs text-[var(--ink-subtle)]">
                              {branch.depts.length} Abteilungen
                            </p>
                          </div>
                          <CountBadge n={branch.peopleCount} />
                        </button>

                        {siteOpen ? (
                          <div className="ml-2 space-y-0.5 pb-2">
                            {branch.depts.map(({ dept, people }) => {
                              if (!dept) return null;
                              const key = `${branch.site}:${dept.id}`;
                              const deptOpen = openDepts[key] ?? false;
                              return (
                                <div
                                  key={key}
                                  className="relative ml-4 border-l border-[var(--line)] pl-3"
                                >
                                  <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleDept(key)}
                                    className="org-node flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-left"
                                  >
                                    <Chevron open={deptOpen} />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-[var(--ink)]">
                                        {dept.name}
                                      </p>
                                      <p className="text-xs text-[var(--ink-subtle)]">
                                        Auslastung{" "}
                                        {
                                          departmentCapacityFromTasks(
                                            dept.id,
                                            state.users,
                                            state.tasks,
                                          ).percent
                                        }{" "}
                                        %
                                      </p>
                                    </div>
                                    <CountBadge n={people.length} />
                                  </button>
                                  <Link
                                    href={`/departments/${dept.id}`}
                                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Dashboard
                                  </Link>
                                  </div>

                                  {deptOpen ? (
                                    <ul className="ml-4 space-y-0.5 border-l border-[var(--line)] pl-3 pb-2">
                                      {people.map((person) => {
                                        const active = selectedUserId === person.id;
                                        return (
                                          <li key={person.id}>
                                            <button
                                              type="button"
                                              onClick={() => selectPerson(person)}
                                              className={`org-node flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left ${
                                                active
                                                  ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/30"
                                                  : ""
                                              }`}
                                            >
                                              <Avatar name={person.name} />
                                              <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                  {person.name}
                                                </p>
                                                <p className="truncate text-xs text-[var(--ink-muted)]">
                                                  {person.roleLabel}
                                                </p>
                                              </div>
                                              <StatusPill tone="accent">
                                                L{Math.max(...person.skills.map((s) => s.level), 1)}
                                              </StatusPill>
                                            </button>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Extern branch */}
                  <div className="relative ml-3 mt-1 border-l border-[var(--line)] pl-3">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSites((prev) => ({
                          ...prev,
                          extern: !prev.extern,
                        }))
                      }
                      className="org-node flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left"
                    >
                      <Chevron open={!!openSites.extern} />
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--warm-soft)] text-[11px] font-bold text-[var(--warm)]">
                        EX
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Externe Partner</p>
                        <p className="text-xs text-[var(--ink-subtle)]">eingeschränkter Zugang</p>
                      </div>
                      <CountBadge n={externUsers.length} />
                    </button>
                    {openSites.extern ? (
                      <ul className="ml-4 space-y-0.5 border-l border-[var(--line)] pl-3 pb-2">
                        {externUsers.map((person) => (
                          <li key={person.id}>
                            <button
                              type="button"
                              onClick={() => selectPerson(person)}
                              className={`org-node flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left ${
                                selectedUserId === person.id
                                  ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/30"
                                  : ""
                              }`}
                            >
                              <Avatar name={person.name} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{person.name}</p>
                                <p className="truncate text-xs text-[var(--ink-muted)]">
                                  {person.company ?? person.roleLabel}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Auswahl">
            {selectedUser ? (
              <div className="animate-fade-up">
                <div className="flex items-start gap-3">
                  <Avatar name={selectedUser.name} />
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{selectedUser.name}</p>
                    <p className="text-sm text-[var(--ink-muted)]">{selectedUser.roleLabel}</p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[var(--ink-subtle)]">Standort</dt>
                    <dd>{locationLabel[selectedUser.location]}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[var(--ink-subtle)]">Abteilung</dt>
                    <dd>
                      {state.departments.find((d) => d.id === selectedUser.departmentId)?.name}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[var(--ink-subtle)]">Auslastung</dt>
                    <dd>
                      {personCapacityFromTasks(selectedUser.id, state.tasks)} %
                      <span className="ml-1 text-[var(--ink-subtle)]">
                        (aus offenen Aufträgen)
                      </span>
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-[var(--ink-subtle)]">Fähigkeiten</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.skills.map((s) => (
                      <StatusPill key={s.name} tone={s.confirmed ? "accent" : "neutral"}>
                        {s.name} · {s.level}
                      </StatusPill>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentUserId(selectedUser.id)}
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
                  >
                    Als Demo-Benutzer setzen
                  </button>
                  <Link
                    href="/people"
                    className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink-muted)] hover:bg-[var(--bg-elevated)]"
                  >
                    Zur Mitarbeiterliste
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--ink-subtle)]">
                Im Baum eine Abteilung aufklappen und einen Mitarbeiter anklicken.
              </p>
            )}
          </Panel>

          <Panel title="Schnellüberblick Standorte">
            <ul className="space-y-3">
              {tree.map((b) => (
                <li key={b.site} className="text-sm">
                  <div className="mb-1 flex items-center justify-between font-medium">
                    <span>{locationLabel[b.site]}</span>
                    <span className="text-[var(--ink-muted)]">{b.peopleCount} Personen</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {b.depts.map(({ dept, people }) =>
                      dept ? (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => {
                            setOpenRoot(true);
                            setOpenSites((p) => ({ ...p, [b.site]: true }));
                            setOpenDepts((p) => ({
                              ...p,
                              [`${b.site}:${dept.id}`]: true,
                            }));
                          }}
                          className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-xs text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          {dept.name} · {people.length}
                        </button>
                      ) : null,
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
