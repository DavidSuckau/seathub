"use client";

import { useState } from "react";
import {
  Button,
  Field,
  PageHeader,
  Panel,
  StatusPill,
  inputClass,
} from "@/components/ui";
import { locationLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { DepartmentId, DemoRole, LocationId, SkillName, User } from "@/lib/types";

const skillNames: SkillName[] = [
  "Naehen",
  "Leder",
  "Reparatur",
  "Zuschnitt",
  "Polstern",
  "Schnittentwicklung",
  "CAD",
  "Musterbau",
  "Dokumentation",
];

export default function PeoplePage() {
  const { state, addUser, addSubstitution, getUser } = useStore();
  const [tab, setTab] = useState<"liste" | "matrix" | "vertretung">("liste");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    roleLabel: "Mitarbeiter",
    departmentId: "naeherei" as DepartmentId,
    location: "hannover" as LocationId,
    demoRole: "mitarbeiter" as DemoRole,
    skill: "Naehen" as SkillName,
    level: 3 as 1 | 2 | 3 | 4 | 5,
  });
  const [subForm, setSubForm] = useState({
    absentUserId: "u-tom",
    substituteUserId: "u-david",
    from: "2026-09-18",
    to: "2026-09-25",
    note: "",
  });

  function createUser() {
    if (!form.name.trim()) return;
    addUser({
      name: form.name.trim(),
      roleLabel: form.roleLabel,
      departmentId: form.departmentId,
      location: form.location,
      demoRole: form.demoRole,
      capacityPercent: 70,
      skills: [{ name: form.skill, level: form.level, confirmed: false }],
    });
    setShowForm(false);
    setForm((f) => ({ ...f, name: "" }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Kompetenz & Vertretung"
        title="Mitarbeiter"
        description="Anlegen, Skill-Matrix und Vertretungsmodell für die Demo."
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Abbrechen" : "Mitarbeiter anlegen"}
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["liste", "Liste"],
            ["matrix", "Skill-Matrix"],
            ["vertretung", "Vertretung"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === id
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] bg-[var(--surface)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showForm ? (
        <Panel title="Neuer Mitarbeiter" className="mb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Rolle">
              <input
                className={inputClass}
                value={form.roleLabel}
                onChange={(e) => setForm({ ...form, roleLabel: e.target.value })}
              />
            </Field>
            <Field label="Abteilung">
              <select
                className={inputClass}
                value={form.departmentId}
                onChange={(e) =>
                  setForm({ ...form, departmentId: e.target.value as DepartmentId })
                }
              >
                {state.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Standort">
              <select
                className={inputClass}
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value as LocationId })
                }
              >
                <option value="hannover">Hannover</option>
                <option value="rumaenien">Rumänien</option>
                <option value="extern">Extern</option>
              </select>
            </Field>
            <Field label="Fähigkeit">
              <select
                className={inputClass}
                value={form.skill}
                onChange={(e) => setForm({ ...form, skill: e.target.value as SkillName })}
              >
                {skillNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Level">
              <select
                className={inputClass}
                value={form.level}
                onChange={(e) =>
                  setForm({ ...form, level: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })
                }
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    Level {n}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={createUser}>Speichern</Button>
          </div>
        </Panel>
      ) : null}

      {tab === "liste" ? (
        <Panel>
          <ul className="divide-y divide-[var(--line)]">
            {state.users.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {u.roleLabel} ·{" "}
                    {state.departments.find((d) => d.id === u.departmentId)?.name} ·{" "}
                    {locationLabel[u.location]}
                    {u.company ? ` · ${u.company}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.skills.slice(0, 4).map((s) => (
                    <StatusPill key={s.name} tone={s.confirmed ? "accent" : "neutral"}>
                      {s.name} {s.level}
                      {!s.confirmed ? "*" : ""}
                    </StatusPill>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--ink-subtle)]">* = selbst angegeben, noch nicht bestätigt</p>
        </Panel>
      ) : null}

      {tab === "matrix" ? <SkillMatrix users={state.users} /> : null}

      {tab === "vertretung" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Vertretung anlegen">
            <div className="grid gap-4">
              <Field label="Abwesend">
                <select
                  className={inputClass}
                  value={subForm.absentUserId}
                  onChange={(e) => setSubForm({ ...subForm, absentUserId: e.target.value })}
                >
                  {state.users
                    .filter((u) => u.demoRole !== "extern")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Vertretung">
                <select
                  className={inputClass}
                  value={subForm.substituteUserId}
                  onChange={(e) =>
                    setSubForm({ ...subForm, substituteUserId: e.target.value })
                  }
                >
                  {state.users
                    .filter((u) => u.demoRole !== "extern")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Von">
                  <input
                    type="date"
                    className={inputClass}
                    value={subForm.from}
                    onChange={(e) => setSubForm({ ...subForm, from: e.target.value })}
                  />
                </Field>
                <Field label="Bis">
                  <input
                    type="date"
                    className={inputClass}
                    value={subForm.to}
                    onChange={(e) => setSubForm({ ...subForm, to: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Notiz">
                <input
                  className={inputClass}
                  value={subForm.note}
                  onChange={(e) => setSubForm({ ...subForm, note: e.target.value })}
                />
              </Field>
              <Button
                onClick={() => {
                  addSubstitution(subForm);
                  setSubForm((s) => ({ ...s, note: "" }));
                }}
              >
                Vertretung speichern
              </Button>
            </div>
          </Panel>
          <Panel title="Aktive Vertretungen">
            <ul className="space-y-4">
              {state.substitutions.map((s) => (
                <li key={s.id} className="rounded-lg border border-[var(--line)] p-3 text-sm">
                  <p className="font-medium">
                    {getUser(s.absentUserId)?.name} → {getUser(s.substituteUserId)?.name}
                  </p>
                  <p className="text-[var(--ink-muted)]">
                    {s.from} bis {s.to}
                  </p>
                  {s.note ? <p className="mt-1 text-[var(--ink-subtle)]">{s.note}</p> : null}
                  <p className="mt-2 text-xs text-[var(--accent)]">
                    Tipp: Im LOP-Detail als Vertretung übernehmen – Zeit zählt ab Übernahme.
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function SkillMatrix({ users }: { users: User[] }) {
  const cols = ["Naehen", "Leder", "Reparatur", "Zuschnitt", "Polstern"] as SkillName[];
  const rows = users.filter((u) => u.demoRole !== "extern");

  return (
    <Panel title="Skill-Matrix">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-[var(--ink-subtle)]">
              <th className="py-2 pr-4 font-medium">Mitarbeiter</th>
              {cols.map((c) => (
                <th key={c} className="px-2 py-2 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-[var(--line)]">
                <td className="py-3 pr-4 font-medium">{u.name}</td>
                {cols.map((c) => {
                  const skill = u.skills.find((s) => s.name === c);
                  return (
                    <td key={c} className="px-2 py-3">
                      {skill ? (
                        <StatusPill tone={skill.confirmed ? "accent" : "neutral"}>
                          {skill.level}
                        </StatusPill>
                      ) : (
                        <span className="text-[var(--ink-subtle)]">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
