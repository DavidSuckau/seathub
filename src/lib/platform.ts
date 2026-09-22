import type {
  AgentInsight,
  AgentKind,
  ChecklistItem,
  FlowNode,
  FlowNodeKind,
  PlatformAgent,
  ProcessFlow,
  Task,
  TaskType,
  User,
} from "./types";
import { orderPreferredSkills, orderTypeDepartment } from "./orders";
import { uid } from "./labels";

export const flowNodeKindLabel: Record<FlowNodeKind, string> = {
  start: "Start",
  auftrag: "Auftrag",
  abteilung: "Abteilung",
  agent: "KI-Agent",
  freigabe: "Freigabe",
  lager: "Lager",
  standort: "Standort",
  ende: "Ende",
};

export const agentKindLabel: Record<AgentKind, string> = {
  entwicklung: "Entwicklungs-Agent",
  cad: "CAD- / Schnitt-Agent",
  dokumentation: "Dokumentations-Agent",
  ressourcen: "Ressourcen-Agent",
  lager: "Lager-Agent",
  termin: "Termin-Agent",
  qualitaet: "Qualitäts-Agent",
  abteilungsleiter: "Abt.-Leiter-Agent",
  wissen: "Wissens-Agent",
};

export const checklistForTaskType: Partial<Record<TaskType, string[]>> = {
  bezugsentwicklung: [
    "Lastenheft / Vorgabe geprüft",
    "Ähnliche Bezüge recherchiert",
    "Kunde / Intern abgestimmt",
    "Materialwahl dokumentiert",
  ],
  entwicklungsschleife: [
    "Änderungsgrund erfasst",
    "Betroffene Profile geprüft",
    "Neuer Stand angelegt",
  ],
  schnittentwicklung: [
    "Kontur geprüft",
    "Nahtzugabe plausibel",
    "Export für CAD vorbereitet",
  ],
  cad: [
    "Zeichnung aktualisiert",
    "Version verglichen",
    "Fehlende Daten gemeldet",
  ],
  zuschnittauftrag: [
    "Material reserviert",
    "Schachtelung geprüft",
    "Zuschnitt freigegeben",
  ],
  naehauftrag: [
    "Muster / Vorgabe gelesen",
    "Nahtbild kontrolliert",
    "Fotos dokumentiert",
  ],
  dokumentation: [
    "Fotos gesammelt",
    "Bericht erstellt",
    "Ablage geprüft",
  ],
  pruefung: [
    "Prüfkriterien gelesen",
    "Abweichungen erfasst",
    "Freigabe empfohlen oder LOP",
  ],
};

export function buildChecklist(labels: string[]): ChecklistItem[] {
  return labels.map((label) => ({
    id: uid(),
    label,
    done: false,
  }));
}

export function checklistComplete(items: ChecklistItem[] | undefined): boolean {
  if (!items?.length) return true;
  return items.every((i) => i.done);
}

export type AssigneeSuggestion = {
  user: User;
  score: number;
  reasons: string[];
};

/** Digitale Abteilungsleiter-Logik: Skill + freie Kapazität */
export function suggestAssignees(
  users: User[],
  taskType: TaskType,
  limit = 3,
): AssigneeSuggestion[] {
  const dept = orderTypeDepartment[taskType];
  const preferred = orderPreferredSkills[taskType] ?? [];
  return users
    .filter((u) => u.departmentId === dept && u.demoRole !== "extern")
    .map((u) => {
      const reasons: string[] = [];
      let score = 0;
      const skillHits = u.skills.filter((s) => preferred.includes(s.name));
      const skillScore = skillHits.reduce((a, s) => a + s.level, 0);
      score += skillScore * 12;
      if (skillHits.length) {
        reasons.push(
          `Skills: ${skillHits.map((s) => `${s.name} L${s.level}`).join(", ")}`,
        );
      }
      const free = Math.max(0, 100 - u.capacityPercent);
      score += free * 0.8;
      reasons.push(`Kapazität ${u.capacityPercent}% (frei ~${free}%)`);
      if (u.location === "hannover") {
        score += 5;
        reasons.push("Standort Hannover");
      }
      return { user: u, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function nextFlowNode(
  flow: ProcessFlow,
  currentNodeId: string,
): FlowNode | undefined {
  const edge = flow.edges.find((e) => e.from === currentNodeId);
  if (!edge) return undefined;
  return flow.nodes.find((n) => n.id === edge.to);
}

export function firstAuftragNode(flow: ProcessFlow): FlowNode | undefined {
  const start = flow.nodes.find((n) => n.kind === "start");
  if (!start) return flow.nodes.find((n) => n.kind === "auftrag");
  let cur: FlowNode | undefined = start;
  for (let i = 0; i < 20; i++) {
    const next = nextFlowNode(flow, cur.id);
    if (!next) return undefined;
    if (next.kind === "auftrag") return next;
    cur = next;
  }
  return undefined;
}

export function createDemoAgents(): PlatformAgent[] {
  return [
    {
      id: "ag-entw",
      kind: "entwicklung",
      name: "Entwicklungs-Agent",
      role: "Digitaler Zwilling Entwicklung",
      description:
        "Findet ähnliche Bezüge, sammelt offene Punkte und bereitet Lessons Learned vor.",
      status: "aktiv",
      focus: ["Ähnlichkeit", "Risiken", "Lastenheft"],
    },
    {
      id: "ag-cad",
      kind: "cad",
      name: "CAD- / Schnitt-Agent",
      role: "Digitaler Zwilling Konstruktion",
      description:
        "Überwacht Stände, fehlende CAD-Daten und Freigabe-Warteschlangen.",
      status: "aktiv",
      focus: ["Versionen", "Freigaben", "Fehlende Daten"],
    },
    {
      id: "ag-doku",
      kind: "dokumentation",
      name: "Dokumentations-Agent",
      role: "Digitaler Zwilling Doku",
      description: "Sammelt Fotos, erstellt Berichte und Prüfprotokolle.",
      status: "beobachtet",
      focus: ["Fotos", "PDF", "Kundenbericht"],
    },
    {
      id: "ag-res",
      kind: "ressourcen",
      name: "Ressourcen-Agent",
      role: "Kapazität & Skills",
      description:
        "Schlägt Mitarbeiter nach Qualifikation und Auslastung vor.",
      status: "aktiv",
      focus: ["Zuweisung", "Auslastung", "Skills"],
    },
    {
      id: "ag-lager",
      kind: "lager",
      name: "Lager-Agent",
      role: "Digitales Lager",
      description:
        "Kennt Lagerorte, Bestände und schlägt Umlagerungen vor (Demo).",
      status: "aktiv",
      focus: ["HD13", "Leder", "Reservierung"],
    },
    {
      id: "ag-termin",
      kind: "termin",
      name: "Termin-Agent",
      role: "SOP & Meilensteine",
      description: "Warnt bei SOP-Nähe und kritischen Musterterminen.",
      status: "aktiv",
      focus: ["SOP", "Engpässe", "Ampel"],
    },
    {
      id: "ag-qs",
      kind: "qualitaet",
      name: "Qualitäts-Agent",
      role: "Fehler & Reklamationen",
      description: "Clusterte LOP-Ursachen und schlägt Verbesserungen vor.",
      status: "beobachtet",
      focus: ["Nahtbild", "LOPs", "Ursachen"],
    },
    {
      id: "ag-lead",
      kind: "abteilungsleiter",
      name: "Abt.-Leiter-Agent",
      role: "Digitaler Abteilungsleiter",
      description:
        "Plant Einsätze, priorisiert und kann Aufträge auto-verteilen (mit Bestätigung).",
      status: "aktiv",
      focus: ["Planung", "Priorität", "Delegation"],
    },
    {
      id: "ag-wissen",
      kind: "wissen",
      name: "Wissens-Agent",
      role: "Firmenwissen",
      description: "Ähnliche Projekte und Best Practices aus der Historie.",
      status: "idle",
      focus: ["82 % Ähnlichkeit", "BMW 2025", "Best Practice"],
    },
  ];
}

export function createDemoFlows(): ProcessFlow[] {
  return [
    {
      id: "flow-bezug-muster",
      name: "Sitzbezug Muster – End-to-End",
      description:
        "Klassischer Musterprozess: Entwicklung → CAD → Zuschnitt → Näherei → Dokumentation → Qualität.",
      mode: "auto",
      active: true,
      nodes: [
        { id: "n0", kind: "start", label: "Start", x: 40, y: 160 },
        {
          id: "n1",
          kind: "auftrag",
          label: "Bezugsentwicklung",
          x: 200,
          y: 140,
          taskType: "bezugsentwicklung",
          departmentId: "engineering",
          checklistLabels: checklistForTaskType.bezugsentwicklung,
          agentId: "ag-entw",
        },
        {
          id: "n2",
          kind: "agent",
          label: "CAD-Agent prüft",
          x: 400,
          y: 60,
          agentId: "ag-cad",
        },
        {
          id: "n3",
          kind: "auftrag",
          label: "CAD / Schnitt",
          x: 400,
          y: 200,
          taskType: "cad",
          departmentId: "cad",
          checklistLabels: checklistForTaskType.cad,
        },
        {
          id: "n4",
          kind: "lager",
          label: "Lager prüfen",
          x: 600,
          y: 60,
          agentId: "ag-lager",
        },
        {
          id: "n5",
          kind: "auftrag",
          label: "Zuschnitt",
          x: 600,
          y: 200,
          taskType: "zuschnittauftrag",
          departmentId: "zuschnitt",
          checklistLabels: checklistForTaskType.zuschnittauftrag,
        },
        {
          id: "n6",
          kind: "auftrag",
          label: "Näherei",
          x: 800,
          y: 200,
          taskType: "naehauftrag",
          departmentId: "naeherei",
          checklistLabels: checklistForTaskType.naehauftrag,
        },
        {
          id: "n7",
          kind: "auftrag",
          label: "Dokumentation",
          x: 1000,
          y: 140,
          taskType: "dokumentation",
          departmentId: "dokumentation",
          checklistLabels: checklistForTaskType.dokumentation,
          agentId: "ag-doku",
        },
        {
          id: "n8",
          kind: "freigabe",
          label: "Qualität / Freigabe",
          x: 1180,
          y: 140,
          taskType: "pruefung",
          departmentId: "engineering",
        },
        { id: "n9", kind: "ende", label: "Versand / Ende", x: 1360, y: 160 },
      ],
      edges: [
        { id: "e0", from: "n0", to: "n1" },
        { id: "e1", from: "n1", to: "n2" },
        { id: "e2", from: "n1", to: "n3" },
        { id: "e3", from: "n3", to: "n4" },
        { id: "e4", from: "n3", to: "n5" },
        { id: "e5", from: "n5", to: "n6" },
        { id: "e6", from: "n6", to: "n7" },
        { id: "e7", from: "n7", to: "n8" },
        { id: "e8", from: "n8", to: "n9" },
      ],
    },
    {
      id: "flow-entwicklungsschleife",
      name: "Entwicklungsschleife kurz",
      description: "Änderung → CAD → Prüfung – für schnelle Präsentation.",
      mode: "vorschlagen",
      active: true,
      nodes: [
        { id: "s0", kind: "start", label: "Start", x: 40, y: 120 },
        {
          id: "s1",
          kind: "auftrag",
          label: "Entwicklungsschleife",
          x: 220,
          y: 100,
          taskType: "entwicklungsschleife",
          departmentId: "engineering",
          checklistLabels: checklistForTaskType.entwicklungsschleife,
        },
        {
          id: "s2",
          kind: "auftrag",
          label: "CAD",
          x: 440,
          y: 100,
          taskType: "cad",
          departmentId: "cad",
          checklistLabels: checklistForTaskType.cad,
        },
        {
          id: "s3",
          kind: "freigabe",
          label: "Prüfung",
          x: 660,
          y: 100,
          taskType: "pruefung",
        },
        { id: "s4", kind: "ende", label: "Ende", x: 860, y: 120 },
      ],
      edges: [
        { id: "se0", from: "s0", to: "s1" },
        { id: "se1", from: "s1", to: "s2" },
        { id: "se2", from: "s2", to: "s3" },
        { id: "se3", from: "s3", to: "s4" },
      ],
    },
  ];
}

export function createDemoInsights(): AgentInsight[] {
  const now = Date.now();
  return [
    {
      id: "ins-1",
      agentId: "ag-lager",
      at: new Date(now - 1000 * 60 * 12).toISOString(),
      title: "Leder Alcantara – Bestand ok",
      detail: "HD13: 24 m² · HD17: 12 m² · Reservierung für Programm ABC möglich.",
      severity: "ok",
      actionLabel: "Lager anzeigen",
      href: "/agents",
    },
    {
      id: "ins-2",
      agentId: "ag-termin",
      at: new Date(now - 1000 * 60 * 28).toISOString(),
      title: "SOP Programm ABC kritisch",
      detail: "Mustertermin gefährdet – Schnittentwicklung hinter Plan.",
      severity: "kritisch",
      actionLabel: "Zum Programm",
      href: "/projects/p-audi",
    },
    {
      id: "ins-3",
      agentId: "ag-lead",
      at: new Date(now - 1000 * 60 * 45).toISOString(),
      title: "Zuweisungsvorschlag Näherei",
      detail: "Anna Berger (Kapazität 78 %, Skill Nähen L4) besser als Julia (74 %).",
      severity: "info",
      actionLabel: "Aufträge",
      href: "/tasks",
    },
    {
      id: "ins-4",
      agentId: "ag-wissen",
      at: new Date(now - 1000 * 60 * 90).toISOString(),
      title: "Ähnliches Bauteil gefunden",
      detail: "Sportsitz Alcantara ähnelt W 990 zu 82 % – Schnittübernahme prüfen.",
      severity: "info",
    },
    {
      id: "ins-5",
      agentId: "ag-qs",
      at: new Date(now - 1000 * 60 * 120).toISOString(),
      title: "LOP-Cluster Nahtbild",
      detail: "68 % der offenen Punkte betreffen Nahtbild / Kopfstütze.",
      severity: "warn",
      actionLabel: "LOPs",
      href: "/lops",
    },
  ];
}

export function taskReadyToComplete(task: Task): boolean {
  return checklistComplete(task.checklist);
}
