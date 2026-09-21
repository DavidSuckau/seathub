import type { TaskType } from "@/lib/types";

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconShell({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="28"
      height="28"
      aria-hidden
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

/** CAD-Anwendung: Monitor mit Zeichenraster */
function IconCad() {
  return (
    <IconShell>
      <rect x="3" y="5" width="26" height="18" rx="2" {...stroke} />
      <path d="M11 27h10M16 23v4" {...stroke} />
      <path d="M8 11h6M8 15h10M8 19h4" {...stroke} />
      <path d="M20 10l4 3-4 3" {...stroke} />
    </IconShell>
  );
}

/** Zuschnitt: Schere + Stoffbahn */
function IconZuschnitt() {
  return (
    <IconShell>
      <circle cx="9" cy="10" r="3" {...stroke} />
      <circle cx="9" cy="22" r="3" {...stroke} />
      <path d="M11.5 12.5L24 22M11.5 19.5L24 10" {...stroke} />
      <path d="M24 8v16" {...stroke} />
    </IconShell>
  );
}

/** Nähmaschine: Körper, Arm, Nadel, Fuß */
function IconNaehen() {
  return (
    <IconShell>
      <path d="M5 24h22" {...stroke} />
      <path d="M7 24V14h10v10" {...stroke} />
      <path d="M17 16h8v4h-3v4" {...stroke} />
      <path d="M22 12v4M22 10.5v0" {...stroke} />
      <circle cx="12" cy="10" r="2.5" {...stroke} />
      <path d="M12 12.5V16" {...stroke} />
    </IconShell>
  );
}

/** Bezug / Sitzbezug: stilisierter Sitz mit Stoff */
function IconBezug() {
  return (
    <IconShell>
      <path d="M6 20c0-6 4-10 10-10s10 4 10 10" {...stroke} />
      <path d="M6 20h20v3H6z" {...stroke} />
      <path d="M10 14c2-1 4-1 6 0s4 1 6 0" {...stroke} />
      <path d="M8 23v3M24 23v3" {...stroke} />
    </IconShell>
  );
}

/** Entwicklungsschleife: Kreislauf / Refresh */
function IconSchleife() {
  return (
    <IconShell>
      <path d="M8 12a8 8 0 0 1 14-2" {...stroke} />
      <path d="M22 6v4h-4" {...stroke} />
      <path d="M24 20a8 8 0 0 1-14 2" {...stroke} />
      <path d="M10 26v-4h4" {...stroke} />
      <circle cx="16" cy="16" r="2" {...stroke} />
    </IconShell>
  );
}

/** Polsterei: Schaum/Polster mit Hammer/Werkzeug am Sitz */
function IconPolster() {
  return (
    <IconShell>
      <path d="M5 22h22v3H5z" {...stroke} />
      <path d="M7 22c0-5 3-9 9-9s9 4 9 9" {...stroke} />
      <path d="M11 15h10" {...stroke} />
      <path d="M22 8l4 2-2 4-4-2z" {...stroke} />
      <path d="M20 14l2-2" {...stroke} />
    </IconShell>
  );
}

/** Prüfung: Lupe + Haken */
function IconPruefung() {
  return (
    <IconShell>
      <circle cx="14" cy="14" r="7" {...stroke} />
      <path d="M19 19l6 6" {...stroke} />
      <path d="M11 14l2 2 4-4" {...stroke} />
    </IconShell>
  );
}

/** Schnittentwicklung: Schnittmuster / Papier mit Linien */
function IconSchnitt() {
  return (
    <IconShell>
      <path d="M8 5h12l4 4v18H8V5z" {...stroke} />
      <path d="M20 5v4h4" {...stroke} />
      <path d="M12 14l3-2 3 2v6l-3 2-3-2v-6z" {...stroke} />
      <path d="M12 14l3 2 3-2M15 16v6" {...stroke} />
    </IconShell>
  );
}

/** Musterbau: 3D-Würfel / Musterobjekt */
function IconMusterbau() {
  return (
    <IconShell>
      <path d="M16 6l10 5v10l-10 5L6 21V11z" {...stroke} />
      <path d="M16 6v10M16 16l10-5M16 16L6 11" {...stroke} />
    </IconShell>
  );
}

/** Dokumentation: Dokument */
function IconDoku() {
  return (
    <IconShell>
      <path d="M9 5h10l4 4v18H9V5z" {...stroke} />
      <path d="M19 5v4h4" {...stroke} />
      <path d="M13 14h8M13 18h8M13 22h5" {...stroke} />
    </IconShell>
  );
}

/** Änderung: Stift / Edit */
function IconAenderung() {
  return (
    <IconShell>
      <path d="M18 6l4 4L12 20H8v-4L18 6z" {...stroke} />
      <path d="M15 9l4 4" {...stroke} />
      <path d="M6 26h20" {...stroke} />
    </IconShell>
  );
}

/** Material: Paket / Rolle */
function IconMaterial() {
  return (
    <IconShell>
      <path d="M5 12l11-5 11 5-11 5-11-5z" {...stroke} />
      <path d="M5 12v9l11 5 11-5v-9" {...stroke} />
      <path d="M16 17v9" {...stroke} />
    </IconShell>
  );
}

/** Fallback */
function IconDefault() {
  return (
    <IconShell>
      <rect x="6" y="6" width="20" height="20" rx="3" {...stroke} />
      <path d="M12 16h8M16 12v8" {...stroke} />
    </IconShell>
  );
}

const ICONS: Partial<Record<TaskType, () => React.ReactNode>> = {
  cad: IconCad,
  zuschnittauftrag: IconZuschnitt,
  naehauftrag: IconNaehen,
  bezugsentwicklung: IconBezug,
  entwicklungsschleife: IconSchleife,
  polsterauftrag: IconPolster,
  pruefung: IconPruefung,
  schnittentwicklung: IconSchnitt,
  musterbau: IconMusterbau,
  dokumentation: IconDoku,
  aenderung: IconAenderung,
  materialbestellung: IconMaterial,
};

export function OrderTypeIcon({ type }: { type: TaskType | string }) {
  const Cmp = ICONS[type as TaskType] ?? IconDefault;
  return <Cmp />;
}
