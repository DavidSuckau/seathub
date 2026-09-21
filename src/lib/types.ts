export type DemoRole = "mitarbeiter" | "manager" | "engineering" | "extern";

export type LocationId = "hannover" | "rumaenien" | "extern";

export type DepartmentId =
  | "trim-engineering"
  | "engineering"
  | "schnittentwicklung"
  | "cad"
  | "naeherei"
  | "zuschnitt"
  | "polsterei"
  | "musterbau"
  | "dokumentation"
  | "werke"
  | "support"
  | "ausbildung"
  | "extern";

export type TaskStatus =
  | "offen"
  | "in_bearbeitung"
  | "rueckfrage"
  | "warten_material"
  | "warten_freigabe"
  | "warten_extern"
  | "zur_pruefung"
  | "erledigt"
  | "abgeschlossen"
  | "abgelehnt"
  | "gestoppt";

export type TaskType =
  | "bezugsentwicklung"
  | "entwicklungsschleife"
  | "schnittentwicklung"
  | "cad"
  | "naehauftrag"
  | "zuschnittauftrag"
  | "polsterauftrag"
  | "dokumentation"
  | "materialbestellung"
  | "musterbau"
  | "reparatur"
  | "support"
  | "extern"
  | "pruefung"
  | "aenderung";

export type ProjectStatus =
  | "planung"
  | "entwicklung"
  | "musterbau"
  | "pruefung"
  | "freigabe"
  | "abgeschlossen"
  | "gestoppt";

export type Ampel = "gruen" | "gelb" | "orange" | "rot";

export type LopSource =
  | "engineering"
  | "entwicklung"
  | "werk"
  | "kunde"
  | "management"
  | "projektleitung"
  | "naeherei"
  | "polsterei"
  | "dokumentation"
  | "intern";

export type LopStatus =
  | "offen"
  | "bewertung"
  | "in_bearbeitung"
  | "schnitt"
  | "naeherei"
  | "musterbau"
  | "pruefung"
  | "dokumentation"
  | "freigabe"
  | "geschlossen";

export type SkillName =
  | "Naehen"
  | "Leder"
  | "Reparatur"
  | "Zuschnitt"
  | "Polstern"
  | "Schnittentwicklung"
  | "CAD"
  | "Musterbau"
  | "Dokumentation";

export interface Skill {
  name: SkillName;
  level: 1 | 2 | 3 | 4 | 5;
  confirmed: boolean;
}

export interface User {
  id: string;
  name: string;
  roleLabel: string;
  departmentId: DepartmentId;
  location: LocationId;
  skills: Skill[];
  demoRole: DemoRole;
  company?: string;
  capacityPercent: number;
}

export interface Department {
  id: DepartmentId;
  name: string;
  location?: LocationId;
  capacityPercent: number;
}

export interface Project {
  id: string;
  /** Fahrzeugprogramm, z. B. W 990 */
  code: string;
  name: string;
  customer: string;
  status: ProjectStatus;
  ampel: Ampel;
  locations: LocationId[];
  description: string;
  milestoneLabel?: string;
  milestoneRisk?: string;
  /**
   * Leistungsumfang dieses Programms:
   * - bezug: nur Bezüge
   * - bezug_schnittstelle: Bezüge + Anbindung an Kunststoff/Struktur (Abstimmung)
   * - komplettsitz: Bezug + eigene Struktur/Kunststoff/Metall-Bauteile
   */
  supplyScope: SupplyScope;
}

export type SupplyScope = "bezug" | "bezug_schnittstelle" | "komplettsitz";

/** Flexible Projektstruktur – Tiefe und Labels können pro Programm unterschiedlich sein */
export type StructureNodeType = "sitzreihe" | "sitzvariante" | "bezugvariante" | "modul";

export type ModuleKind =
  | "bezug"
  | "schnittstelle"
  | "struktur"
  | "kunststoff"
  | "metall"
  | "schaum"
  | "profil";

/** Art des Bauteils in der Stückliste / Assemblierung */
export type PartKind = "hauptteil" | "profil" | "befestigung" | "sonstig" | "schaum";

/**
 * Welcher Stand einer Komponente (Profil, Schaum, …) an einem Bezug-/Assemblierungs-Stand hängt.
 * Bezug und Komponenten haben unabhängige Revisionsstände – oft wird ein Profil 1:1 übernommen.
 */
export interface ComponentStandRef {
  partId: string;
  /** Stand der Komponente, der an diesem Assemblierungs-Stand verwendet wird */
  revision: string;
  /**
   * true = Profil-/Komponenten-Stand unverändert vom Vorgänger-Bezug übernommen
   * (kein neues CAD, keine neue Profil-Revision nötig)
   */
  carriedOver: boolean;
}

export type PartSide = "links" | "rechts" | "mitte" | "einzeln";

/**
 * entwickelt = führendes Teil (wird konstruiert)
 * spiegel = eigene TN, gespiegelt vom Master – Doku/Kunde, nicht doppelt entwickelt
 * eigenstaendig = L und R werden getrennt entwickelt
 */
export type DevelopmentRole = "entwickelt" | "spiegel" | "eigenstaendig";

export interface StructureNode {
  id: string;
  projectId: string;
  parentId: string | null;
  type: StructureNodeType;
  label: string;
  sortOrder: number;
  /** Nur bei type === "modul" */
  moduleKind?: ModuleKind;
}

export interface Part {
  id: string;
  partNumber: string;
  name: string;
  projectId: string;
  /** Blatt der Struktur (Bezugvariante, Modul, …) */
  structureNodeId?: string;
  side?: PartSide;
  moduleKind?: ModuleKind;
  /**
   * hauptteil = Bezug / Hauptbauteil
   * profil = z. B. OKR-Kurzschlussprofil (eigener TN, eigene Zeichnung)
   */
  partKind?: PartKind;
  /**
   * Legacy / Primär-Bezug: einzelnes Elternteil.
   * Für geteilte Profile bevorzugt usedOnPartIds nutzen.
   */
  parentPartId?: string;
  /**
   * Bezüge / Assemblierungen, die dieses Profil/diese Komponente verwenden.
   * Ein geteiltes Profil (Leder + Stoff + Alcantara) erscheint in allen usedOnPartIds.
   * Änderung am Profil wirkt auf alle diese Bezüge.
   */
  usedOnPartIds?: string[];
  /** Rolle in der Assemblierung, z. B. „OKR seitlich Sitzseite“ */
  componentRole?: string;
  /** Verantwortlicher Ingenieur */
  engineerUserId?: string;
  /** Bezugsentwickler */
  coverDeveloperUserId?: string;
  /** Aktuell aktiver Stand (oft die laufende Entwicklungsschleife) */
  currentRevision: string;
  /** Zuletzt freigegebener / relaunchter Stand für Produktion */
  releasedRevision?: string;
  developmentRole?: DevelopmentRole;
  /** Bei Spiegelteil: ID des entwickelten Masters */
  mirrorMasterPartId?: string;
  /** Gegenstück Links/Rechts (auch am Master gesetzt) */
  mirrorPairPartId?: string;
  /** Kurzinfo zur Anbindung (z. B. Kunststoffschale) */
  interfaceNote?: string;
}

/**
 * Stand / Revision eines Bauteils – nie überschreiben, immer neu anlegen.
 * in_entwicklung = neue Schleife läuft
 * freigegeben / relaunched = freigegebener Stand für Produktion und Dokumentation
 */
export type RevisionStatus =
  | "in_entwicklung"
  | "zur_pruefung"
  | "freigegeben"
  | "relaunched"
  | "abgelehnt"
  | "ersetzt";

export interface Revision {
  id: string;
  partId: string;
  /** Stand z. B. "03", "04" */
  revision: string;
  title: string;
  date: string;
  createdByUserId: string;
  userType: "intern" | "extern";
  company?: string;
  reason: string;
  status: RevisionStatus;
  /** Vorgängerstand */
  basedOnRevision?: string;
  relaunchedAt?: string;
  relaunchedByUserId?: string;
  /** Versionsspezifische Anhänge (Zeichnungen gehören zum Stand) */
  drawings: string[];
  photos: string[];
  documents: string[];
  /** Stücklistenpositionen dieses Stands */
  bomItems: string[];
  /**
   * Bei Bezug/Assemblierung: welche Komponenten-Stände genau an diesem Stand hängen.
   * Unabhängig vom aktuellen Stand der Komponente – dokumentiert die Verwendung.
   */
  componentStands?: ComponentStandRef[];
  /** Legacy / Kurzliste */
  files: string[];
  /**
   * Gewicht dieses Stands in Gramm.
   * Verlauf über Stände = Gewichtsänderung über die Entwicklung.
   */
  weightGrams?: number;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  projectId: string;
  partId?: string;
  /** Optionaler Bezug zum Bauteil-Stand */
  revisionStand?: string;
  assigneeId?: string;
  /** Wer den Auftrag eingestellt hat (z. B. Vorgesetzter) */
  createdByUserId?: string;
  departmentId: DepartmentId;
  /** true = Abteilung muss noch einen Mitarbeiter zuweisen */
  needsAssignment?: boolean;
  priority: "niedrig" | "normal" | "hoch" | "kritisch";
  dueDate: string;
  progress: number;
  description: string;
  rejectReason?: string;
  createdAt: string;
  risk?: Ampel;
  /** Start der Bearbeitung (z. B. bei „In Bearbeitung“) */
  startedAt?: string;
  /** Zeitpunkt der Erledigung */
  completedAt?: string;
  /** Dokumentierte Bearbeitungszeit in Minuten (bei Erledigung Pflicht) */
  timeSpentMinutes?: number;
}

export interface LopStep {
  id: string;
  label: string;
  done: boolean;
  at?: string;
}

/** Chronik-Eintrag: wer hat wann was gemacht / geändert */
export interface LopHistoryEntry {
  id: string;
  at: string;
  actorUserId: string;
  action: string;
  detail?: string;
}

export interface Lop {
  id: string;
  title: string;
  description: string;
  source: LopSource;
  status: LopStatus;
  projectId: string;
  partId?: string;
  /** Auftrag, aus dem der LOP angelegt wurde */
  taskId?: string;
  departmentIds: DepartmentId[];
  assigneeIds: string[];
  createdByUserId: string;
  createdAt: string;
  dueDate?: string;
  /** @deprecated Pflicht-Workflow – durch history ersetzt */
  steps?: LopStep[];
  /** Chronik aller Änderungen und Tätigkeiten */
  history: LopHistoryEntry[];
  takenOverAt?: string;
  takenOverByUserId?: string;
  /** Foto-Anhänge (Dateiname oder data-URL) */
  photos: string[];
}

export interface Approval {
  id: string;
  taskId?: string;
  lopId?: string;
  projectId: string;
  revisionId?: string;
  decision: "offen" | "freigeben" | "ablehnen" | "rueckfrage";
  requestedAt: string;
  decidedAt?: string;
  decidedByUserId?: string;
  comment?: string;
}

export interface Substitution {
  id: string;
  absentUserId: string;
  substituteUserId: string;
  from: string;
  to: string;
  note?: string;
}

export interface Activity {
  id: string;
  at: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  detail?: string;
}

export interface SeatHubState {
  version: number;
  currentUserId: string;
  demoRole: DemoRole;
  users: User[];
  departments: Department[];
  projects: Project[];
  structureNodes: StructureNode[];
  parts: Part[];
  revisions: Revision[];
  tasks: Task[];
  lops: Lop[];
  approvals: Approval[];
  substitutions: Substitution[];
  activityLog: Activity[];
}
