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
  /**
   * Ausstattung mit Bezug auf Bezug/Schaum/Anbindung
   * (z. B. Sitzheizung, Lüftung, Massage)
   */
  equipment?: string[];
  /** SOP-Termin (Start of Production), Pflicht bei Neuanlage */
  sopDate?: string;
  /**
   * true = Kopfstützen-Entwicklung gehört zum Programm-Auftrag
   * false = ohne Kopfstützen-Entwicklung
   */
  includesHeadrest?: boolean;
}

export type SupplyScope = "bezug" | "bezug_schnittstelle" | "komplettsitz";

/** Konfiguration für den Programm-Anlege-Assistenten */
export type ArmrestHoleVariant = "mit_loch" | "ohne_loch";
export type HeadrestScope = "mit" | "ohne";

export interface ProgramSeatConfig {
  /** Sitzart / Basisname, z. B. Sportsitz */
  label: string;
  /** Bezugmaterialien unter diesem Design */
  covers: string[];
  /**
   * Bezug-Varianten Armlehne: mit Loch / ohne Loch (können beide gewählt werden).
   * Wird mit jedem Material zu eigenen Bezugvarianten kombiniert.
   */
  armrestHoles?: ArmrestHoleVariant[];
  /**
   * Design-/Ausstattungsmerkmale dieser Variante (mit Airbag, Design A …).
   */
  designTags?: string[];
  /**
   * Links/Rechts-Frage:
   * lr = eigene L- und R-Bezüge, einzeln = eine TN, mitte = Bank
   */
  sideMode?: "einzeln" | "mitte" | "lr";
  /** Kopfstützen-Entwicklung für dieses Design */
  headrest?: HeadrestScope;
}

export interface ProgramRowConfig {
  label: string;
  seats: ProgramSeatConfig[];
}

/** Gespeicherte / Archiv-Vorlage für die Programm-Anlage */
export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  customerHint?: string;
  supplyScope: SupplyScope;
  equipment: string[];
  rows: ProgramRowConfig[];
  /** Vorschlag SOP relativ (nur Hinweistext) */
  sopDateHint?: string;
  includesHeadrest?: boolean;
  /** true = vom Nutzer ins Archiv gelegt */
  custom?: boolean;
}

export interface ProgramCreateConfig {
  code: string;
  name: string;
  customer: string;
  description?: string;
  supplyScope: SupplyScope;
  locations?: LocationId[];
  /** Programmweit (zusätzlich zu Design-Tags an Sitzarten) */
  equipment: string[];
  rows: ProgramRowConfig[];
  /** Welche Vorlage genutzt wurde */
  templateId?: string;
  /** SOP-Termin (Pflicht) */
  sopDate: string;
  /** Programm inkl. Kopfstützen-Entwicklung */
  includesHeadrest: boolean;
}

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
  /**
   * Virtueller Bezug: noch keine reale TN / Platzhalter für frühe Entwicklung & Aufträge
   */
  isVirtual?: boolean;
  /**
   * Hauptbild des Bauteils (URL oder data:-URL).
   * In der Demo vorbefüllt; Nutzer können es ersetzen.
   */
  imageUrl?: string;
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

/**
 * Ein Zuschnittteil aus der Bezug-Stückliste
 * (Export Zuschnittentwicklung – viele Teile je Bezug).
 */
export interface CutPiece {
  id: string;
  /** z. B. TEIL1231413 */
  teilename: string;
  /** z. B. HAUPTTEIL 100, SEITENWANGE */
  beschreib: string;
  kategorie?: string;
  kommentar?: string;
  matCode?: string;
  /** Fläche in m² (roh aus CSV) */
  flaecheSqm?: string;
  totalFlaecheSqm?: string;
  umrissMm?: string;
  teilX?: string;
  teilY?: string;
  anzKnips?: string;
  anzEcke?: string;
}

/** Zuschnitt-Stückliste am Bezug-Stand (nicht Excel, direkt am Bauteil). */
export interface CutBom {
  createdAt: string;
  importedAt?: string;
  sourceFileName?: string;
  pieces: CutPiece[];
}

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
  /** Stücklistenpositionen dieses Stands (Kurzliste / Legacy) */
  bomItems: string[];
  /**
   * Nur Bezug: strukturierte Zuschnitt-BOM aus CSV der Zuschnittentwicklung.
   * undefined = noch nicht angelegt; pieces[] = angelegt (ggf. leer vor Import).
   */
  cutBom?: CutBom;
  /** Klassische 2D-CAD-Zeichnung (DXF-Text) an diesem Stand */
  dxf?: {
    fileName: string;
    content: string;
    uploadedAt: string;
  };
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
  /** Chronik: Zuweisung, Status, Titel – wer hat was geändert */
  history?: TaskHistoryEntry[];
  /** Zugehöriger Prozess-Flow (Flow-Generator) */
  flowId?: string;
  /** Aktueller Flow-Knoten in diesem Auftrag */
  flowNodeId?: string;
  /** Checklistenpunkte vor Abschluss */
  checklist?: ChecklistItem[];
  /**
   * Modus „vorschlagen“: nächster Schritt wartet auf Bestätigung durch Mensch.
   */
  pendingFollowUp?: PendingFollowUp;
}

/** Vorschlag für Folgeauftrag (Mensch bestätigt) */
export interface PendingFollowUp {
  flowNodeId: string;
  label: string;
  taskType: TaskType;
  departmentId?: DepartmentId;
  agentId?: string;
  checklistLabels?: string[];
  proposedAt: string;
  /** Insights, die beim Walk schon gelaufen sind (Anzeige) */
  note?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  doneAt?: string;
  doneByUserId?: string;
}

/** Node-Arten im Flow-Generator */
export type FlowNodeKind =
  | "start"
  | "auftrag"
  | "abteilung"
  | "agent"
  | "freigabe"
  | "lager"
  | "standort"
  | "ende";

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  label: string;
  x: number;
  y: number;
  /** Bei kind === "auftrag" */
  taskType?: TaskType;
  departmentId?: DepartmentId;
  agentId?: string;
  /** Checkliste, die beim Erzeugen dieses Schritts angehängt wird */
  checklistLabels?: string[];
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
}

/** Prozessvorlage aus dem Flow-Generator */
export interface ProcessFlow {
  id: string;
  name: string;
  description: string;
  /** auto = Folgeauftrag ohne Nachfrage */
  mode: "vorschlagen" | "auto";
  nodes: FlowNode[];
  edges: FlowEdge[];
  active: boolean;
}

export type AgentKind =
  | "entwicklung"
  | "cad"
  | "dokumentation"
  | "ressourcen"
  | "lager"
  | "termin"
  | "qualitaet"
  | "abteilungsleiter"
  | "wissen";

export interface PlatformAgent {
  id: string;
  kind: AgentKind;
  name: string;
  role: string;
  description: string;
  status: "aktiv" | "beobachtet" | "idle";
  focus: string[];
}

export interface AgentInsight {
  id: string;
  agentId: string;
  at: string;
  title: string;
  detail: string;
  severity: "info" | "ok" | "warn" | "kritisch";
  actionLabel?: string;
  href?: string;
}

/** Chronik-Eintrag am Auftrag (analog LOP) */
export interface TaskHistoryEntry {
  id: string;
  at: string;
  actorUserId: string;
  action: string;
  detail?: string;
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
  /** Eigene Programm-Vorlagen (Archiv), zusätzlich zu den Built-ins */
  programTemplates?: ProgramTemplate[];
  /** Flow-Generator: Prozessvorlagen */
  flows?: ProcessFlow[];
  /** Digitale Agenten / Zwillinge */
  agents?: PlatformAgent[];
  /** Laufende Agenten-Insights für Präsentation */
  agentInsights?: AgentInsight[];
}
