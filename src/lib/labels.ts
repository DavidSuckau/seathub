export const taskStatusLabel: Record<string, string> = {
  offen: "Offen",
  in_bearbeitung: "In Bearbeitung",
  rueckfrage: "Rückfrage",
  warten_material: "Warten auf Material",
  warten_freigabe: "Warten auf Freigabe",
  warten_extern: "Warten auf Extern",
  zur_pruefung: "Zur Prüfung",
  erledigt: "Erledigt",
  abgeschlossen: "Abgeschlossen",
  abgelehnt: "Abgelehnt",
  gestoppt: "Gestoppt",
};

export const taskTypeLabel: Record<string, string> = {
  bezugsentwicklung: "Bezugsentwicklung",
  entwicklungsschleife: "Entwicklungsschleife",
  schnittentwicklung: "Schnittentwicklung",
  cad: "CAD-Zeichnungen",
  naehauftrag: "Nähauftrag",
  zuschnittauftrag: "Zuschnittauftrag",
  polsterauftrag: "Polsterauftrag",
  dokumentation: "Dokumentation",
  materialbestellung: "Materialbestellung",
  musterbau: "Musterbau",
  reparatur: "Reparatur",
  support: "Support",
  extern: "Externer Auftrag",
  pruefung: "Prüfauftrag",
  aenderung: "Änderungsauftrag",
};

export const lopSourceLabel: Record<string, string> = {
  engineering: "Engineering",
  entwicklung: "Entwicklung",
  werk: "Werk",
  kunde: "Kunde",
  management: "Management",
  projektleitung: "Projektleitung",
  naeherei: "Näherei",
  polsterei: "Polsterei",
  dokumentation: "Dokumentation",
  intern: "Intern",
};

export const lopStatusLabel: Record<string, string> = {
  offen: "Offen",
  bewertung: "Bewertung",
  in_bearbeitung: "In Bearbeitung",
  schnitt: "Schnitt",
  naeherei: "Näherei",
  musterbau: "Musterbau",
  pruefung: "Prüfung",
  dokumentation: "Dokumentation",
  freigabe: "Freigabe",
  geschlossen: "Geschlossen",
};

export const projectStatusLabel: Record<string, string> = {
  planung: "Planung",
  entwicklung: "Entwicklung",
  musterbau: "Musterbau",
  pruefung: "Prüfung",
  freigabe: "Freigabe",
  abgeschlossen: "Abgeschlossen",
  gestoppt: "Gestoppt",
};

export const locationLabel: Record<string, string> = {
  hannover: "Hannover",
  rumaenien: "Rumänien",
  extern: "Extern",
};

export const ampelLabel: Record<string, string> = {
  gruen: "Im Plan",
  gelb: "Beobachten",
  orange: "Gefährdet",
  rot: "Kritisch",
};

export const demoRoleLabel: Record<string, string> = {
  mitarbeiter: "Mitarbeiter",
  manager: "Vorgesetzter",
  engineering: "Engineering",
  extern: "Extern",
};

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Minuten → lesbare Dauer, z. B. „2 Std. 15 Min.“ */
export function formatDuration(minutes: number | undefined | null): string {
  if (minutes == null || Number.isNaN(minutes) || minutes < 0) return "—";
  const m = Math.round(minutes);
  if (m < 60) return `${m} Min.`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (rest === 0) return `${h} Std.`;
  return `${h} Std. ${rest} Min.`;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
