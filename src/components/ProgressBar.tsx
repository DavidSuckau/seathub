export function ProgressBar({
  percent,
  label,
  detail,
}: {
  percent: number;
  label?: string;
  detail?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="w-full min-w-[140px]">
      {label || detail ? (
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-xs">
          {label ? <span className="font-medium text-[var(--ink)]">{label}</span> : <span />}
          {detail ? <span className="text-[var(--ink-muted)]">{detail}</span> : null}
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-1 text-right text-sm font-semibold tabular-nums text-[var(--ink)]">
        {clamped} %
      </p>
    </div>
  );
}
