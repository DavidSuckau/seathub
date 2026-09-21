"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { demoRoleLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { DemoRole } from "@/lib/types";
import { Button } from "./ui";

type NavItem = { href: string; label: string; exact?: boolean };

function navForRole(
  role: DemoRole,
  departmentId: string | undefined,
): NavItem[] {
  const myDeptHref = departmentId
    ? `/departments/${departmentId}`
    : "/departments";

  switch (role) {
    case "mitarbeiter":
      return [
        { href: "/dashboard", label: "Mein Tag" },
        { href: "/calendar", label: "Kalender" },
        { href: "/tasks", label: "Aufträge" },
        { href: myDeptHref, label: "Meine Abteilung" },
        { href: "/lops", label: "LOPs" },
        { href: "/projects", label: "Projekte" },
        { href: "/org", label: "Organisation" },
      ];
    case "manager":
      return [
        { href: "/management", label: "Management" },
        { href: "/dashboard", label: "Mein Tag" },
        { href: "/calendar", label: "Kalender" },
        { href: "/departments", label: "Abteilungen", exact: true },
        { href: "/projects", label: "Projekte" },
        { href: "/lops", label: "LOPs" },
        { href: "/tasks", label: "Aufträge" },
        { href: "/people", label: "Mitarbeiter" },
        { href: "/org", label: "Organisation" },
      ];
    case "engineering":
      return [
        { href: "/dashboard", label: "Mein Tag" },
        { href: "/calendar", label: "Kalender" },
        { href: myDeptHref, label: "Meine Abteilung" },
        { href: "/projects", label: "Projekte" },
        { href: "/projects/p-daimler", label: "Programm W 990" },
        { href: "/lops", label: "LOPs" },
        { href: "/tasks", label: "Aufträge" },
        { href: "/people", label: "Skills" },
        { href: "/org", label: "Organisation" },
      ];
    case "extern":
      return [{ href: "/external", label: "Meine Aufträge" }];
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
  const { state, currentUser, setDemoRole, setCurrentUserId, resetDemo } = useStore();
  const nav = useMemo(
    () => navForRole(state.demoRole, currentUser?.departmentId),
    [state.demoRole, currentUser?.departmentId],
  );
  const roleUsers = state.users.filter((u) => u.demoRole === state.demoRole);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
              SH
            </span>
            <div className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-[var(--ink)]">
                SeatHub
              </span>
              <span className="block text-[11px] text-[var(--ink-subtle)]">Prototyp</span>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex rounded-full bg-[var(--bg-elevated)] p-0.5">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setDemoRole(role)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
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
              className="max-w-[160px] rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink)]"
              value={state.currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
              title={currentUser?.roleLabel}
            >
              {(roleUsers.length ? roleUsers : state.users).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <Button variant="ghost" onClick={resetDemo} className="!rounded-full !text-xs !px-3 !py-1.5">
              Reset
            </Button>
          </div>
        </div>

        <div className="border-t border-[var(--line)] bg-[var(--surface)]">
          <nav className="mx-auto flex max-w-7xl gap-0 overflow-x-auto px-4 sm:px-6 lg:px-8">
            {nav.map((item) => {
              const active = isNavActive(pathname, item);
              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "text-[var(--accent)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                  {active ? (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--accent)]" />
                  ) : null}
                </Link>
              );
            })}
            <Link
              href="/vision"
              className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition ${
                pathname === "/vision"
                  ? "text-[var(--warm)]"
                  : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
              }`}
            >
              Vision
              {pathname === "/vision" ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--warm)]" />
              ) : null}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-[var(--line)] py-5 text-center text-xs text-[var(--ink-subtle)]">
        SeatHub Prototyp · Daten nur lokal im Browser · kein Backend
      </footer>
    </div>
  );
}
