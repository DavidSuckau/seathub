"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";

/**
 * Eine dominante nächste Aktion pro Screen (SeatHub UX).
 */
export function NextAction({
  title = "Nächster Schritt",
  description,
  primaryLabel,
  onPrimary,
  primaryHref,
  secondary,
  children,
}: {
  title?: string;
  description?: ReactNode;
  primaryLabel: string;
  onPrimary?: () => void;
  primaryHref?: string;
  secondary?: ReactNode;
  children?: ReactNode;
}) {
  const primary = primaryHref ? (
    <Link href={primaryHref}>
      <Button>{primaryLabel}</Button>
    </Link>
  ) : (
    <Button onClick={onPrimary}>{primaryLabel}</Button>
  );

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] px-5 py-5 shadow-[var(--shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
        {title}
      </p>
      {description ? (
        <div className="mt-2 text-xl font-semibold text-[var(--ink)]">
          {description}
        </div>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">{primary}{secondary}</div>
    </section>
  );
}
