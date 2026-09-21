import type { Ampel } from "@/lib/types";
import { ampelLabel } from "@/lib/labels";

export function AmpelBadge({ ampel, showLabel = true }: { ampel: Ampel; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[var(--ink-muted)]">
      <span className={`ampel-dot ampel-${ampel}`} aria-hidden />
      {showLabel ? ampelLabel[ampel] : null}
    </span>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "watch" | "warn" | "danger" | "accent";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--bg-elevated)] text-[var(--ink-muted)] border-[var(--line)]",
    ok: "bg-[var(--ok-soft)] text-[var(--ok)] border-transparent",
    watch: "bg-[var(--watch-soft)] text-[var(--watch)] border-transparent",
    warn: "bg-[var(--warn-soft)] text-[var(--warn)] border-transparent",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)] border-transparent",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)] border-transparent",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Panel({
  children,
  className = "",
  title,
  action,
  flush = false,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3">
          {title ? (
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </header>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium text-[var(--accent)]">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    primary:
      "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] border-transparent shadow-[var(--shadow)]",
    secondary:
      "bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--bg-elevated)]",
    ghost: "bg-transparent text-[var(--ink-muted)] border-transparent hover:bg-[var(--bg-elevated)]",
    danger: "bg-[var(--danger)] text-white border-transparent hover:opacity-90",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-[var(--ink-muted)]">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--ink-subtle)]">{children}</p>;
}

export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[var(--line-strong)] bg-[var(--surface)]/70 p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
        Vision / später
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-[var(--ink-muted)]">{text}</p>
    </div>
  );
}
