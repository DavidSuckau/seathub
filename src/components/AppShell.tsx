"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { demoRoleLabel } from "@/lib/labels";
import { isTeamLead } from "@/lib/roles";
import { useStore } from "@/lib/store";
import type { DemoRole } from "@/lib/types";
import { Button } from "./ui";

type NavItem = { href: string; label: string; exact?: boolean };

type NavSection = { title?: string; items: NavItem[] };

function navSectionsForRole(
  role: DemoRole,
  departmentId: string | undefined,
  teamLead: boolean,
): NavSection[] {
  const myDeptHref = departmentId
    ? `/departments/${departmentId}`
    : "/departments";

  switch (role) {
    case "extern":
      return [{ items: [{ href: "/external", label: "Meine Aufträge" }] }];
    case "manager":
      return [
        {
          title: "Arbeitsplatz",
          items: [
            { href: "/management", label: "Übersicht" },
            { href: "/tasks", label: "Warteschlange" },
            { href: "/departments", label: "Abteilungen", exact: true },
            { href: "/lops", label: "LOPs" },
          ],
        },
        {
          title: "Studio",
          items: [
            { href: "/studio", label: "Studio" },
            { href: "/flows", label: "Flows" },
            { href: "/agents", label: "Agenten" },
            { href: "/projects", label: "Projekte" },
            { href: "/org", label: "Organisation" },
          ],
        },
      ];
    case "engineering":
      return [
        {
          title: "Arbeitsplatz",
          items: [
            { href: "/dashboard", label: "Mein Tag" },
            { href: "/tasks", label: "Aufträge" },
            { href: "/projects", label: "Programme" },
            { href: "/lops", label: "LOPs" },
            { href: "/calendar", label: "Kalender" },
          ],
        },
        {
          title: "Studio",
          items: [
            { href: "/studio", label: "Studio" },
            { href: "/flows", label: "Flows" },
            { href: "/agents", label: "Agenten" },
          ],
        },
      ];
    case "mitarbeiter":
    default: {
      const work: NavItem[] = [
        { href: "/dashboard", label: "Mein Tag" },
        { href: "/tasks", label: "Aufträge" },
        { href: "/lops", label: "LOPs" },
        { href: "/calendar", label: "Kalender" },
      ];
      if (teamLead) {
        work.splice(1, 0, { href: myDeptHref, label: "Team" });
      }
      return [
        { title: "Arbeitsplatz", items: work },
        // Studio nur über Demo-Hinweis unten – nicht in Hauptnav
      ];
    }
  }
}

function homeHref(role: DemoRole): string {
  switch (role) {
    case "extern":
      return "/external";
    case "manager":
      return "/management";
    default:
      return "/dashboard";
  }
}

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  if (pathname === item.href) return true;
  return pathname.startsWith(item.href + "/");
}

const roles: DemoRole[] = ["mitarbeiter", "manager", "engineering", "extern"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, currentUser, setDemoRole, setCurrentUserId, resetDemo } =
    useStore();
  const teamLead = isTeamLead(currentUser);
  const sections = useMemo(
    () =>
      navSectionsForRole(
        state.demoRole,
        currentUser?.departmentId,
        teamLead,
      ),
    [state.demoRole, currentUser?.departmentId, teamLead],
  );
  const roleUsers = state.users.filter((u) => u.demoRole === state.demoRole);
  const showStudioHint = state.demoRole === "mitarbeiter";

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar – digitaler Arbeitsplatz */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] lg:flex">
        <Link
          href={homeHref(state.demoRole)}
          className="flex items-center gap-2.5 border-b border-[var(--line)] px-4 py-4"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
            SH
          </span>
          <div className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-[var(--ink)]">
              SeatHub
            </span>
            <span className="block text-[11px] text-[var(--ink-subtle)]">
              Arbeitsplatz
            </span>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          {sections.map((sec) => (
            <div key={sec.title ?? "main"}>
              {sec.title ? (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
                  {sec.title}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {sec.items.map((item) => {
                  const active = isNavActive(pathname, item);
                  return (
                    <li key={`${item.label}-${item.href}`}>
                      <Link
                        href={item.href}
                        className={`block rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "text-[var(--ink-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {showStudioHint ? (
            <div className="mt-auto border-t border-[var(--line)] pt-4">
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
                Für Prozess-Owner
              </p>
              <Link
                href="/studio"
                className="block rounded-lg px-2.5 py-2 text-sm text-[var(--ink-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--ink)]"
              >
                Studio öffnen
              </Link>
            </div>
          ) : null}
        </nav>

        <div className="border-t border-[var(--line)] px-4 py-3">
          <p className="truncate text-sm font-medium text-[var(--ink)]">
            {currentUser?.name ?? "—"}
          </p>
          <p className="truncate text-xs text-[var(--ink-subtle)]">
            {currentUser?.roleLabel}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <Link
              href={homeHref(state.demoRole)}
              className="flex items-center gap-2 lg:hidden"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-xs font-bold text-white">
                SH
              </span>
              <span className="text-sm font-semibold">SeatHub</span>
            </Link>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <div className="flex rounded-full bg-[var(--bg-elevated)] p-0.5">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setDemoRole(role)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                      state.demoRole === role
                        ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow)]"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {demoRoleLabel[role]}
                  </button>
                ))}
              </div>
              <select
                className="max-w-[140px] rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink)]"
                value={state.currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
              >
                {(roleUsers.length ? roleUsers : state.users).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                onClick={resetDemo}
                className="!rounded-full !px-3 !py-1.5 !text-xs"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Mobile-Nav: nur Arbeitsplatz */}
          <nav className="flex gap-0 overflow-x-auto border-t border-[var(--line)] px-2 lg:hidden">
            {sections.flatMap((s) => s.items).map((item) => {
              const active = isNavActive(pathname, item);
              return (
                <Link
                  key={`m-${item.label}-${item.href}`}
                  href={item.href}
                  className={`relative shrink-0 px-3 py-2.5 text-sm font-medium ${
                    active
                      ? "text-[var(--accent)]"
                      : "text-[var(--ink-muted)]"
                  }`}
                >
                  {item.label}
                  {active ? (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--accent)]" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="border-t border-[var(--line)] py-4 text-center text-xs text-[var(--ink-subtle)]">
          SeatHub · digitaler Arbeitsplatz · Daten lokal im Browser
        </footer>
      </div>
    </div>
  );
}
