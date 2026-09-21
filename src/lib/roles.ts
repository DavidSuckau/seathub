import type { User } from "./types";

/** Shopfloor-Teamleitung o. Ä. – auch ohne Demo-Rolle „Vorgesetzter“. */
export function isTeamLead(user: User | undefined | null): boolean {
  if (!user) return false;
  if (user.demoRole === "manager") return true;
  return /teamleitung|komplettsitzleiter|abteilungsleitung/i.test(user.roleLabel);
}

export type TaskScope = "meine" | "abteilung" | "alle";

export function defaultTaskScope(
  demoRole: string,
  user: User | undefined | null,
): TaskScope {
  if (demoRole === "manager") return "alle";
  if (isTeamLead(user)) return "abteilung";
  return "meine";
}
