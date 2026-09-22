"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { taskStatusLabel, uid } from "./labels";
import { orderTypeDepartment } from "./orders";
import {
  buildChecklist,
  checklistComplete,
  checklistForTaskType,
  firstTaskCreatingNode,
  resolveTaskTypeForNode,
  walkFlowAfter,
} from "./platform";
import {
  applyComponentDecisions,
  carryOverComponentStands,
  getAssembliesUsing,
  getChildComponents,
  isAssemblyPart,
  isSharedComponent,
} from "./components";
import { nextRevisionNumber } from "./revisions";
import { loadState, resetState, saveState } from "./storage";
import { supplyScopeLabel } from "./structure";
import { expandCoverLabels, seatDisplayLabel } from "./program-templates";
import type {
  Activity,
  AgentInsight,
  Approval,
  DemoRole,
  FlowNode,
  FlowNodeKind,
  Lop,
  LopHistoryEntry,
  Part,
  PendingFollowUp,
  ProcessFlow,
  ProgramCreateConfig,
  ProgramTemplate,
  Revision,
  SeatHubState,
  StructureNode,
  Substitution,
  SupplyScope,
  Task,
  TaskHistoryEntry,
  User,
} from "./types";

type StoreContextValue = {
  state: SeatHubState;
  hydrated: boolean;
  currentUser: User | undefined;
  setDemoRole: (role: DemoRole) => void;
  setCurrentUserId: (id: string) => void;
  resetDemo: () => void;
  logActivity: (partial: Omit<Activity, "id" | "at" | "actorUserId"> & { actorUserId?: string }) => void;
  addTask: (task: Omit<Task, "id" | "createdAt">) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  /** Checklistenpunkt abhaken */
  toggleTaskChecklist: (taskId: string, itemId: string) => void;
  /** Auftrag über Flow starten (erste Auftrag-Node) */
  startProcessFlow: (input: {
    flowId: string;
    projectId: string;
    partId: string;
    title?: string;
  }) => Task | null;
  /**
   * Auftrag erledigen: Checkliste Pflicht, dann optional Folgeauftrag laut Flow.
   * Auto → Folgeauftrag; Vorschlag → pendingFollowUp am erledigten Auftrag.
   */
  completeTaskAutomated: (
    taskId: string,
    timeSpentMinutes: number,
  ) => {
    ok: boolean;
    reason?: string;
    followUp?: Task;
    pendingProposal?: PendingFollowUp;
    reachedEnd?: boolean;
  };
  /** Mensch bestätigt Folge-Vorschlag → erzeugt Auftrag */
  acceptFollowUpProposal: (taskId: string) => Task | null;
  rejectFollowUpProposal: (taskId: string, reason?: string) => void;
  updateFlow: (id: string, patch: Partial<ProcessFlow>) => void;
  moveFlowNode: (flowId: string, nodeId: string, x: number, y: number) => void;
  addFlowNode: (
    flowId: string,
    kind: FlowNodeKind,
    partial?: Partial<FlowNode>,
  ) => FlowNode | null;
  updateFlowNode: (
    flowId: string,
    nodeId: string,
    patch: Partial<FlowNode>,
  ) => void;
  removeFlowNode: (flowId: string, nodeId: string) => void;
  addFlowEdge: (flowId: string, from: string, to: string) => void;
  removeFlowEdge: (flowId: string, edgeId: string) => void;
  duplicateFlow: (flowId: string) => ProcessFlow | null;
  pushAgentInsight: (insight: Omit<AgentInsight, "id" | "at"> & { at?: string }) => void;
  addLop: (
    lop: Omit<Lop, "id" | "createdAt" | "history" | "photos"> & {
      history?: LopHistoryEntry[];
      photos?: string[];
      steps?: Lop["steps"];
    },
  ) => Lop;
  updateLop: (id: string, patch: Partial<Lop>, options?: { silent?: boolean }) => void;
  /** Freier Chronik-Eintrag (Tätigkeit / Kommentar) – kein Pflichtschritt */
  addLopHistory: (lopId: string, action: string, detail?: string) => void;
  takeOverLop: (lopId: string, userId: string) => void;
  addUser: (user: Omit<User, "id">) => User;
  updateUser: (id: string, patch: Partial<User>) => void;
  addSubstitution: (sub: Omit<Substitution, "id">) => void;
  addRevision: (rev: Omit<Revision, "id">) => Revision;
  updateRevision: (id: string, patch: Partial<Revision>) => void;
  addPart: (part: Omit<Part, "id">) => Part;
  /** Bauteil vollständig löschen (inkl. Stände; Verknüpfungen bereinigen) */
  deletePart: (partId: string) => void;
  /** Komplettes Programm inkl. Struktur, Bauteile, Aufträge, LOPs löschen */
  deleteProject: (projectId: string) => void;
  /** Strukturknoten: Sitzreihe, Sitzart, Modul, Bezugvariante */
  addStructureNode: (
    node: Omit<StructureNode, "id">,
  ) => StructureNode;
  /** Sitzart anlegen inkl. Standard-Module je Lieferumfang */
  addSeatVariantWithModules: (input: {
    projectId: string;
    parentRowId: string;
    label: string;
  }) => StructureNode;
  /** Bezugvariante unter einer Sitzart (legt Bezug-Modul an falls nötig) */
  addCoverVariant: (input: {
    projectId: string;
    seatVariantId: string;
    label: string;
  }) => StructureNode;
  /** Neues Programm inkl. Sitzreihen / Varianten / Ausstattung */
  addConfiguredProject: (config: ProgramCreateConfig) => SeatHubState["projects"][0];
  /** Eigene Vorlage ins Archiv legen */
  saveProgramTemplate: (
    tpl: Omit<ProgramTemplate, "id" | "custom"> & { id?: string },
  ) => ProgramTemplate;
  deleteProgramTemplate: (id: string) => void;
  /** Profil an weiteren Bezug knüpfen (geteilte Verwendung) */
  linkComponentToAssembly: (componentPartId: string, assemblyPartId: string) => void;
  /** Neue Entwicklungsschleife: nächster Stand „in Entwicklung“ */
  startDevelopmentLoop: (
    partId: string,
    reason: string,
    options?: {
      /** Bei Bezug: welche Profile 1:1 übernommen vs. neu */
      componentDecisions?: { partId: string; carryOver: boolean }[];
    },
  ) => Revision | null;
  /** Relaunch: Stand freigeben */
  relaunchStand: (partId: string, revisionId: string) => void;
  /** Legt entwickeltes Teil + Spiegelteil (andere Seite, eigene TN) an */
  addLeftRightPair: (input: {
    projectId: string;
    structureNodeId: string;
    baseName: string;
    partNumberLeft: string;
    partNumberRight: string;
    developSide: "links" | "rechts";
    moduleKind?: Part["moduleKind"];
    engineerUserId?: string;
    coverDeveloperUserId?: string;
  }) => { master: Part; mirror: Part };
  updateApproval: (id: string, patch: Partial<Approval>) => void;
  getProject: (id: string) => SeatHubState["projects"][0] | undefined;
  getPart: (id: string) => Part | undefined;
  getUser: (id: string) => User | undefined;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function modulesForScope(
  projectId: string,
  seatVariantId: string,
  scope: SupplyScope,
): StructureNode[] {
  const modules: StructureNode[] = [
    {
      id: uid(),
      projectId,
      parentId: seatVariantId,
      type: "modul",
      label: "Bezug",
      moduleKind: "bezug",
      sortOrder: 1,
    },
  ];
  if (scope === "bezug_schnittstelle") {
    modules.push({
      id: uid(),
      projectId,
      parentId: seatVariantId,
      type: "modul",
      label: "Anbindung",
      moduleKind: "schnittstelle",
      sortOrder: 2,
    });
  }
  if (scope === "komplettsitz") {
    modules.push(
      {
        id: uid(),
        projectId,
        parentId: seatVariantId,
        type: "modul",
        label: "Kunststoff",
        moduleKind: "kunststoff",
        sortOrder: 2,
      },
      {
        id: uid(),
        projectId,
        parentId: seatVariantId,
        type: "modul",
        label: "Schaum",
        moduleKind: "schaum",
        sortOrder: 3,
      },
      {
        id: uid(),
        projectId,
        parentId: seatVariantId,
        type: "modul",
        label: "Struktur / Metall",
        moduleKind: "struktur",
        sortOrder: 4,
      },
    );
  }
  return modules;
}

function withSave(updater: (prev: SeatHubState) => SeatHubState) {
  return (prev: SeatHubState) => {
    const next = updater(prev);
    saveState(next);
    return next;
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SeatHubState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  const mutate = useCallback((fn: (prev: SeatHubState) => SeatHubState) => {
    setState((prev) => {
      if (!prev) return prev;
      return withSave(fn)(prev);
    });
  }, []);

  const logActivity = useCallback(
    (partial: Omit<Activity, "id" | "at" | "actorUserId"> & { actorUserId?: string }) => {
      mutate((prev) => {
        const entry: Activity = {
          id: uid(),
          at: new Date().toISOString(),
          actorUserId: partial.actorUserId ?? prev.currentUserId,
          action: partial.action,
          entityType: partial.entityType,
          entityId: partial.entityId,
          detail: partial.detail,
        };
        return { ...prev, activityLog: [entry, ...prev.activityLog].slice(0, 200) };
      });
    },
    [mutate],
  );

  const value = useMemo<StoreContextValue | null>(() => {
    if (!state) return null;

    const currentUser = state.users.find((u) => u.id === state.currentUserId);

    return {
      state,
      hydrated,
      currentUser,
      setDemoRole: (role) => {
        mutate((prev) => {
          const match = prev.users.find((u) => u.demoRole === role);
          return {
            ...prev,
            demoRole: role,
            currentUserId: match?.id ?? prev.currentUserId,
          };
        });
      },
      setCurrentUserId: (id) => {
        mutate((prev) => {
          const user = prev.users.find((u) => u.id === id);
          return {
            ...prev,
            currentUserId: id,
            demoRole: user?.demoRole ?? prev.demoRole,
          };
        });
      },
      resetDemo: () => {
        const seed = resetState();
        setState(seed);
      },
      logActivity,
      addTask: (task) => {
        const createdAt = new Date().toISOString();
        const actorId = task.createdByUserId ?? "";
        const checklist =
          task.checklist?.length
            ? task.checklist
            : buildChecklist(checklistForTaskType[task.type] ?? []);
        const history: TaskHistoryEntry[] = [
          {
            id: uid(),
            at: createdAt,
            actorUserId: actorId,
            action: "Auftrag angelegt",
            detail: task.title,
          },
        ];
        if (task.assigneeId) {
          history.push({
            id: uid(),
            at: createdAt,
            actorUserId: actorId,
            action: "Zugewiesen",
            detail: task.assigneeId,
          });
        }
        const created: Task = {
          ...task,
          id: uid(),
          createdAt,
          history,
          checklist,
        };
        mutate((prev) => {
          const withNames = {
            ...created,
            history: created.history?.map((h) => {
              if (h.action !== "Zugewiesen") return h;
              const name = prev.users.find((u) => u.id === h.detail)?.name;
              return name ? { ...h, detail: name } : h;
            }),
          };
          return { ...prev, tasks: [withNames, ...prev.tasks] };
        });
        logActivity({
          action: "Auftrag angelegt",
          entityType: "task",
          entityId: created.id,
          detail: created.title,
        });
        return created;
      },
      updateTask: (id, patch) => {
        mutate((prev) => {
          const actorId = prev.currentUserId;
          const now = new Date().toISOString();
          const nameOf = (uid?: string) =>
            uid ? prev.users.find((u) => u.id === uid)?.name ?? "—" : "nicht zugewiesen";

          return {
            ...prev,
            tasks: prev.tasks.map((t) => {
              if (t.id !== id) return t;
              const next = { ...t, ...patch };
              if (
                (patch.status === "in_bearbeitung" || patch.status === "zur_pruefung") &&
                !next.startedAt
              ) {
                next.startedAt = now;
              }
              if (
                (patch.status === "erledigt" || patch.status === "abgeschlossen") &&
                !next.completedAt
              ) {
                next.completedAt = now;
                if (next.progress < 100) next.progress = 100;
              }

              const entries: TaskHistoryEntry[] = [...(t.history ?? [])];
              if (
                patch.assigneeId !== undefined &&
                patch.assigneeId !== t.assigneeId
              ) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Zuweisung geändert",
                  detail: `${nameOf(t.assigneeId)} → ${nameOf(patch.assigneeId)}`,
                });
              }
              if (patch.status && patch.status !== t.status) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Status geändert",
                  detail: `${taskStatusLabel[t.status] ?? t.status} → ${taskStatusLabel[patch.status] ?? patch.status}`,
                });
              }
              if (patch.title != null && patch.title !== t.title) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Titel geändert",
                  detail: `${t.title} → ${patch.title}`,
                });
              }
              if (
                patch.priority != null &&
                patch.priority !== t.priority
              ) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Priorität geändert",
                  detail: `${t.priority} → ${patch.priority}`,
                });
              }
              if (patch.dueDate != null && patch.dueDate !== t.dueDate) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Fälligkeit geändert",
                  detail: `${t.dueDate} → ${patch.dueDate}`,
                });
              }
              if (patch.rejectReason && patch.rejectReason !== t.rejectReason) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Abgelehnt",
                  detail: patch.rejectReason,
                });
              }
              if (
                patch.timeSpentMinutes != null &&
                patch.timeSpentMinutes !== t.timeSpentMinutes
              ) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Zeit dokumentiert",
                  detail: `${patch.timeSpentMinutes} Min.`,
                });
              }

              return { ...next, history: entries };
            }),
          };
        });
        logActivity({
          action: "Auftrag aktualisiert",
          entityType: "task",
          entityId: id,
          detail: Object.keys(patch).join(", "),
        });
      },
      toggleTaskChecklist: (taskId, itemId) => {
        mutate((prev) => {
          const now = new Date().toISOString();
          return {
            ...prev,
            tasks: prev.tasks.map((t) => {
              if (t.id !== taskId || !t.checklist) return t;
              return {
                ...t,
                checklist: t.checklist.map((c) =>
                  c.id === itemId
                    ? {
                        ...c,
                        done: !c.done,
                        doneAt: !c.done ? now : undefined,
                        doneByUserId: !c.done ? prev.currentUserId : undefined,
                      }
                    : c,
                ),
              };
            }),
          };
        });
      },
      startProcessFlow: (input) => {
        const flow = state.flows?.find((f) => f.id === input.flowId);
        if (!flow) return null;
        const node = firstTaskCreatingNode(flow);
        const taskType = node ? resolveTaskTypeForNode(node) : undefined;
        if (!node || !taskType) return null;
        const labels =
          node.checklistLabels ??
          checklistForTaskType[taskType] ??
          [];
        const createdAt = new Date().toISOString();
        const created: Task = {
          id: uid(),
          title:
            input.title?.trim() ||
            `${node.label} · Flow ${flow.name}`,
          type: taskType,
          status: "offen",
          projectId: input.projectId,
          partId: input.partId,
          departmentId:
            node.departmentId ?? orderTypeDepartment[taskType],
          createdByUserId: state.currentUserId,
          needsAssignment: true,
          priority: "hoch",
          dueDate: "2026-10-15",
          progress: 0,
          description: `Gestartet über Flow „${flow.name}“. Agenten begleiten den Prozess.`,
          createdAt,
          flowId: flow.id,
          flowNodeId: node.id,
          checklist: buildChecklist(labels),
          history: [
            {
              id: uid(),
              at: createdAt,
              actorUserId: state.currentUserId,
              action: "Flow gestartet",
              detail: flow.name,
            },
          ],
        };
        mutate((prev) => ({
          ...prev,
          tasks: [created, ...prev.tasks],
          agentInsights: [
            {
              id: uid(),
              agentId: node.agentId ?? "ag-lead",
              at: createdAt,
              title: `Flow gestartet: ${flow.name}`,
              detail: `Erster Schritt „${node.label}“ angelegt.`,
              severity: "info" as const,
              href: `/tasks/${created.id}`,
              actionLabel: "Auftrag öffnen",
            },
            ...(prev.agentInsights ?? []),
          ].slice(0, 40),
        }));
        logActivity({
          action: "Prozess-Flow gestartet",
          entityType: "flow",
          entityId: flow.id,
          detail: created.title,
        });
        return created;
      },
      completeTaskAutomated: (taskId, timeSpentMinutes) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return { ok: false, reason: "Auftrag nicht gefunden" };
        if (!checklistComplete(task.checklist)) {
          return { ok: false, reason: "Checkliste noch nicht vollständig" };
        }
        const now = new Date().toISOString();
        let followUp: Task | undefined;
        let pendingProposal: PendingFollowUp | undefined;
        let reachedEnd = false;
        const flow = task.flowId
          ? state.flows?.find((f) => f.id === task.flowId)
          : undefined;
        const walk =
          task.flowNodeId && flow
            ? walkFlowAfter(flow, task.flowNodeId)
            : undefined;
        const walkNote = walk?.passed.length
          ? `Über: ${walk.passed.map((p) => p.label).join(" → ")}`
          : undefined;

        if (flow && walk) {
          reachedEnd = walk.reachedEnd;
          const next = walk.nextTaskNode;
          const nextType = next ? resolveTaskTypeForNode(next) : undefined;
          if (next && nextType && task.partId) {
            if (flow.mode === "auto") {
              const labels =
                next.checklistLabels ??
                checklistForTaskType[nextType] ??
                [];
              followUp = {
                id: uid(),
                title: `${next.label} · Folge aus ${task.title}`,
                type: nextType,
                status: "offen",
                projectId: task.projectId,
                partId: task.partId,
                revisionStand: task.revisionStand,
                departmentId:
                  next.departmentId ?? orderTypeDepartment[nextType],
                createdByUserId: state.currentUserId,
                needsAssignment: true,
                priority: task.priority,
                dueDate: task.dueDate,
                progress: 0,
                description: `Automatisch erzeugt durch Flow „${flow.name}“ nach Abschluss von „${task.title}“.${walkNote ? ` ${walkNote}` : ""}`,
                createdAt: now,
                flowId: flow.id,
                flowNodeId: next.id,
                checklist: buildChecklist(labels),
                history: [
                  {
                    id: uid(),
                    at: now,
                    actorUserId: state.currentUserId,
                    action: "Folgeauftrag (Flow)",
                    detail: `Aus ${task.id}`,
                  },
                ],
              };
            } else {
              pendingProposal = {
                flowNodeId: next.id,
                label: next.label,
                taskType: nextType,
                departmentId: next.departmentId,
                agentId: next.agentId,
                checklistLabels:
                  next.checklistLabels ??
                  checklistForTaskType[nextType],
                proposedAt: now,
                note: walkNote,
              };
            }
          }
        }

        mutate((prev) => {
          const insights = [...(prev.agentInsights ?? [])];
          for (const wi of walk?.insights ?? []) {
            insights.unshift({
              id: uid(),
              agentId: wi.agentId,
              at: now,
              title: wi.title,
              detail: wi.detail,
              severity: wi.severity,
            });
          }
          if (followUp) {
            insights.unshift({
              id: uid(),
              agentId: "ag-lead",
              at: now,
              title: "Folgeauftrag erzeugt",
              detail: followUp.title,
              severity: "ok",
              href: `/tasks/${followUp.id}`,
              actionLabel: "Öffnen",
            });
          } else if (pendingProposal) {
            insights.unshift({
              id: uid(),
              agentId: pendingProposal.agentId ?? "ag-lead",
              at: now,
              title: "Folge-Schritt vorgeschlagen",
              detail: `${pendingProposal.label} – wartet auf Bestätigung`,
              severity: "warn",
              href: `/tasks/${taskId}`,
              actionLabel: "Entscheiden",
            });
          } else if (flow && reachedEnd) {
            insights.unshift({
              id: uid(),
              agentId: "ag-termin",
              at: now,
              title: "Flow abgeschlossen",
              detail: `„${flow.name}“ erreicht Ende nach „${task.title}“.`,
              severity: "ok",
            });
          } else if (flow) {
            insights.unshift({
              id: uid(),
              agentId: "ag-termin",
              at: now,
              title: "Flow-Schritt abgeschlossen",
              detail: task.title,
              severity: "ok",
            });
          }
          return {
            ...prev,
            tasks: [
              ...(followUp ? [followUp] : []),
              ...prev.tasks.map((t) => {
                if (t.id !== taskId) return t;
                return {
                  ...t,
                  status: "erledigt" as const,
                  progress: 100,
                  completedAt: now,
                  timeSpentMinutes,
                  pendingFollowUp: pendingProposal,
                  history: [
                    ...(t.history ?? []),
                    {
                      id: uid(),
                      at: now,
                      actorUserId: prev.currentUserId,
                      action: "Status geändert",
                      detail: `${taskStatusLabel[t.status]} → Erledigt`,
                    },
                    {
                      id: uid(),
                      at: now,
                      actorUserId: prev.currentUserId,
                      action: "Zeit dokumentiert",
                      detail: `${timeSpentMinutes} Min.`,
                    },
                    ...(followUp
                      ? [
                          {
                            id: uid(),
                            at: now,
                            actorUserId: prev.currentUserId,
                            action: "Folgeauftrag gestartet",
                            detail: followUp.title,
                          },
                        ]
                      : []),
                    ...(pendingProposal
                      ? [
                          {
                            id: uid(),
                            at: now,
                            actorUserId: prev.currentUserId,
                            action: "Folge vorgeschlagen",
                            detail: pendingProposal.label,
                          },
                        ]
                      : []),
                    ...(reachedEnd
                      ? [
                          {
                            id: uid(),
                            at: now,
                            actorUserId: prev.currentUserId,
                            action: "Flow Ende erreicht",
                            detail: flow?.name ?? "",
                          },
                        ]
                      : []),
                  ],
                };
              }),
            ],
            agentInsights: insights.slice(0, 40),
          };
        });
        logActivity({
          action: followUp
            ? "Auftrag erledigt + Folgeauftrag"
            : pendingProposal
              ? "Auftrag erledigt + Folge-Vorschlag"
              : "Auftrag erledigt",
          entityType: "task",
          entityId: taskId,
          detail: followUp?.title ?? pendingProposal?.label,
        });
        return { ok: true, followUp, pendingProposal, reachedEnd };
      },
      acceptFollowUpProposal: (taskId) => {
        const task = state.tasks.find((t) => t.id === taskId);
        const proposal = task?.pendingFollowUp;
        if (!task || !proposal || !task.partId || !task.flowId) return null;
        const now = new Date().toISOString();
        const labels = proposal.checklistLabels ?? [];
        const created: Task = {
          id: uid(),
          title: `${proposal.label} · Folge aus ${task.title}`,
          type: proposal.taskType,
          status: "offen",
          projectId: task.projectId,
          partId: task.partId,
          revisionStand: task.revisionStand,
          departmentId:
            proposal.departmentId ??
            orderTypeDepartment[proposal.taskType],
          createdByUserId: state.currentUserId,
          needsAssignment: true,
          priority: task.priority,
          dueDate: task.dueDate,
          progress: 0,
          description: `Vom Menschen bestätigt (Flow-Vorschlag) nach „${task.title}“.${proposal.note ? ` ${proposal.note}` : ""}`,
          createdAt: now,
          flowId: task.flowId,
          flowNodeId: proposal.flowNodeId,
          checklist: buildChecklist(labels),
          history: [
            {
              id: uid(),
              at: now,
              actorUserId: state.currentUserId,
              action: "Folge bestätigt",
              detail: `Aus Vorschlag zu ${task.id}`,
            },
          ],
        };
        mutate((prev) => ({
          ...prev,
          tasks: [
            created,
            ...prev.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    pendingFollowUp: undefined,
                    history: [
                      ...(t.history ?? []),
                      {
                        id: uid(),
                        at: now,
                        actorUserId: prev.currentUserId,
                        action: "Folge-Vorschlag angenommen",
                        detail: created.title,
                      },
                    ],
                  }
                : t,
            ),
          ],
          agentInsights: [
            {
              id: uid(),
              agentId: proposal.agentId ?? "ag-lead",
              at: now,
              title: "Mensch hat Folge bestätigt",
              detail: created.title,
              severity: "ok" as const,
              href: `/tasks/${created.id}`,
              actionLabel: "Öffnen",
            },
            ...(prev.agentInsights ?? []),
          ].slice(0, 40),
        }));
        return created;
      },
      rejectFollowUpProposal: (taskId, reason) => {
        const now = new Date().toISOString();
        mutate((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => {
            if (t.id !== taskId || !t.pendingFollowUp) return t;
            return {
              ...t,
              pendingFollowUp: undefined,
              history: [
                ...(t.history ?? []),
                {
                  id: uid(),
                  at: now,
                  actorUserId: prev.currentUserId,
                  action: "Folge-Vorschlag abgelehnt",
                  detail: reason?.trim() || t.pendingFollowUp.label,
                },
              ],
            };
          }),
          agentInsights: [
            {
              id: uid(),
              agentId: "ag-lead",
              at: now,
              title: "Folge-Vorschlag abgelehnt",
              detail: reason?.trim() || "Ohne Begründung",
              severity: "warn" as const,
              href: `/tasks/${taskId}`,
            },
            ...(prev.agentInsights ?? []),
          ].slice(0, 40),
        }));
      },
      updateFlow: (id, patch) => {
        mutate((prev) => ({
          ...prev,
          flows: (prev.flows ?? []).map((f) =>
            f.id === id ? { ...f, ...patch } : f,
          ),
        }));
      },
      moveFlowNode: (flowId, nodeId, x, y) => {
        mutate((prev) => ({
          ...prev,
          flows: (prev.flows ?? []).map((f) =>
            f.id !== flowId
              ? f
              : {
                  ...f,
                  nodes: f.nodes.map((n) =>
                    n.id === nodeId ? { ...n, x, y } : n,
                  ),
                },
          ),
        }));
      },
      addFlowNode: (flowId, kind, partial) => {
        const flow = state.flows?.find((f) => f.id === flowId);
        if (!flow) return null;
        const defaults: Record<FlowNodeKind, Partial<FlowNode>> = {
          start: { label: "Start" },
          ende: { label: "Ende" },
          auftrag: {
            label: "Neuer Auftrag",
            taskType: "cad",
            departmentId: "cad",
            checklistLabels: checklistForTaskType.cad,
          },
          freigabe: {
            label: "Freigabe",
            taskType: "pruefung",
            departmentId: "engineering",
            checklistLabels: checklistForTaskType.pruefung,
          },
          agent: { label: "KI-Agent", agentId: "ag-lead" },
          lager: { label: "Lager", agentId: "ag-lager" },
          standort: { label: "Standort", agentId: "ag-termin" },
          abteilung: { label: "Abteilung", agentId: "ag-lead" },
        };
        const maxX = Math.max(40, ...flow.nodes.map((n) => n.x));
        const node: FlowNode = {
          id: uid(),
          kind,
          label: defaults[kind].label ?? kind,
          x: maxX + 180,
          y: 160,
          ...defaults[kind],
          ...partial,
        };
        mutate((prev) => ({
          ...prev,
          flows: (prev.flows ?? []).map((f) =>
            f.id === flowId ? { ...f, nodes: [...f.nodes, node] } : f,
          ),
        }));
        return node;
      },
      updateFlowNode: (flowId, nodeId, patch) => {
        mutate((prev) => ({
          ...prev,
          flows: (prev.flows ?? []).map((f) =>
            f.id !== flowId
              ? f
              : {
                  ...f,
                  nodes: f.nodes.map((n) =>
                    n.id === nodeId ? { ...n, ...patch } : n,
                  ),
                },
          ),
        }));
      },
      removeFlowNode: (flowId, nodeId) => {
        mutate((prev) => ({
          ...prev,
          flows: (prev.flows ?? []).map((f) => {
            if (f.id !== flowId) return f;
            const node = f.nodes.find((n) => n.id === nodeId);
            if (node?.kind === "start") return f;
            return {
              ...f,
              nodes: f.nodes.filter((n) => n.id !== nodeId),
              edges: f.edges.filter(
                (e) => e.from !== nodeId && e.to !== nodeId,
              ),
            };
          }),
        }));
      },
      addFlowEdge: (flowId, from, to) => {
        if (from === to) return;
        mutate((prev) => ({
          ...prev,
          flows: (prev.flows ?? []).map((f) => {
            if (f.id !== flowId) return f;
            if (f.edges.some((e) => e.from === from && e.to === to)) return f;
            return {
              ...f,
              edges: [...f.edges, { id: uid(), from, to }],
            };
          }),
        }));
      },
      removeFlowEdge: (flowId, edgeId) => {
        mutate((prev) => ({
          ...prev,
          flows: (prev.flows ?? []).map((f) =>
            f.id !== flowId
              ? f
              : { ...f, edges: f.edges.filter((e) => e.id !== edgeId) },
          ),
        }));
      },
      duplicateFlow: (flowId) => {
        const flow = state.flows?.find((f) => f.id === flowId);
        if (!flow) return null;
        const copy: ProcessFlow = {
          ...flow,
          id: uid(),
          name: `${flow.name} (Kopie)`,
          active: false,
          nodes: flow.nodes.map((n) => ({ ...n })),
          edges: flow.edges.map((e) => ({ ...e })),
        };
        mutate((prev) => ({
          ...prev,
          flows: [...(prev.flows ?? []), copy],
        }));
        return copy;
      },
      pushAgentInsight: (insight) => {
        mutate((prev) => ({
          ...prev,
          agentInsights: [
            {
              id: uid(),
              at: insight.at ?? new Date().toISOString(),
              agentId: insight.agentId,
              title: insight.title,
              detail: insight.detail,
              severity: insight.severity,
              actionLabel: insight.actionLabel,
              href: insight.href,
            },
            ...(prev.agentInsights ?? []),
          ].slice(0, 40),
        }));
      },
      addLop: (lop) => {
        const createdAt = new Date().toISOString();
        const actorId = lop.createdByUserId;
        const history: LopHistoryEntry[] = lop.history?.length
          ? lop.history
          : [
              {
                id: uid(),
                at: createdAt,
                actorUserId: actorId,
                action: "Erstellt",
                detail: lop.title,
              },
            ];
        if ((lop.photos?.length ?? 0) > 0 && !lop.history?.length) {
          history.push({
            id: uid(),
            at: createdAt,
            actorUserId: actorId,
            action: "Fotos angehängt",
            detail: `${lop.photos!.length} Foto(s)`,
          });
        }
        const created: Lop = {
          ...lop,
          id: uid(),
          createdAt,
          history,
          photos: lop.photos ?? [],
          steps: undefined,
        };
        mutate((prev) => ({ ...prev, lops: [created, ...prev.lops] }));
        logActivity({
          action: "LOP erstellt",
          entityType: "lop",
          entityId: created.id,
          detail: created.title,
        });
        return created;
      },
      updateLop: (id, patch, options) => {
        mutate((prev) => {
          const actorId = prev.currentUserId;
          const now = new Date().toISOString();
          return {
            ...prev,
            lops: prev.lops.map((l) => {
              if (l.id !== id) return l;
              const next = { ...l, ...patch };
              if (options?.silent) return next;

              const entries: LopHistoryEntry[] = [...(l.history ?? [])];
              if (patch.status && patch.status !== l.status) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Status geändert",
                  detail: `${l.status} → ${patch.status}`,
                });
              }
              if (patch.description != null && patch.description !== l.description) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Beschreibung geändert",
                });
              }
              if (patch.title != null && patch.title !== l.title) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Titel geändert",
                  detail: patch.title,
                });
              }
              if (patch.photos && patch.photos.length !== (l.photos?.length ?? 0)) {
                const diff = patch.photos.length - (l.photos?.length ?? 0);
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: diff > 0 ? "Fotos angehängt" : "Fotos entfernt",
                  detail: `${patch.photos.length} Foto(s)`,
                });
              }
              if (patch.assigneeIds) {
                entries.push({
                  id: uid(),
                  at: now,
                  actorUserId: actorId,
                  action: "Beteiligte geändert",
                });
              }
              return { ...next, history: entries };
            }),
          };
        });
      },
      addLopHistory: (lopId, action, detail) => {
        const trimmed = action.trim();
        if (!trimmed) return;
        mutate((prev) => ({
          ...prev,
          lops: prev.lops.map((l) => {
            if (l.id !== lopId) return l;
            const entry: LopHistoryEntry = {
              id: uid(),
              at: new Date().toISOString(),
              actorUserId: prev.currentUserId,
              action: trimmed,
              detail: detail?.trim() || undefined,
            };
            return { ...l, history: [...(l.history ?? []), entry] };
          }),
        }));
        logActivity({
          action: "LOP-Eintrag",
          entityType: "lop",
          entityId: lopId,
          detail: trimmed,
        });
      },
      takeOverLop: (lopId, userId) => {
        mutate((prev) => ({
          ...prev,
          lops: prev.lops.map((l) => {
            if (l.id !== lopId) return l;
            const at = new Date().toISOString();
            return {
              ...l,
              takenOverAt: at,
              takenOverByUserId: userId,
              assigneeIds: Array.from(new Set([...l.assigneeIds, userId])),
              history: [
                ...(l.history ?? []),
                {
                  id: uid(),
                  at,
                  actorUserId: userId,
                  action: "Als Vertretung übernommen",
                },
              ],
            };
          }),
        }));
        logActivity({
          action: "LOP übernommen (Vertretung)",
          entityType: "lop",
          entityId: lopId,
          actorUserId: userId,
        });
      },
      addUser: (user) => {
        const created: User = { ...user, id: uid() };
        mutate((prev) => ({ ...prev, users: [...prev.users, created] }));
        logActivity({
          action: "Mitarbeiter angelegt",
          entityType: "user",
          entityId: created.id,
          detail: created.name,
        });
        return created;
      },
      updateUser: (id, patch) => {
        mutate((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        }));
      },
      addSubstitution: (sub) => {
        const created: Substitution = { ...sub, id: uid() };
        mutate((prev) => ({
          ...prev,
          substitutions: [created, ...prev.substitutions],
        }));
        logActivity({
          action: "Vertretung angelegt",
          entityType: "substitution",
          entityId: created.id,
        });
      },
      addRevision: (rev) => {
        const created: Revision = {
          id: uid(),
          drawings: rev.drawings ?? [],
          photos: rev.photos ?? [],
          documents: rev.documents ?? [],
          bomItems: rev.bomItems ?? [],
          files: rev.files ?? [],
          componentStands: rev.componentStands,
          weightGrams: rev.weightGrams,
          partId: rev.partId,
          revision: rev.revision,
          title: rev.title,
          date: rev.date,
          createdByUserId: rev.createdByUserId,
          userType: rev.userType,
          company: rev.company,
          reason: rev.reason,
          status: rev.status,
          basedOnRevision: rev.basedOnRevision,
          relaunchedAt: rev.relaunchedAt,
          relaunchedByUserId: rev.relaunchedByUserId,
        };
        mutate((prev) => ({
          ...prev,
          revisions: [...prev.revisions, created],
          parts: prev.parts.map((p) =>
            p.id === rev.partId ? { ...p, currentRevision: rev.revision } : p,
          ),
        }));
        logActivity({
          action: "Stand angelegt",
          entityType: "revision",
          entityId: created.id,
          detail: `Stand ${created.revision} – ${created.title}`,
        });
        return created;
      },
      updateRevision: (id, patch) => {
        mutate((prev) => ({
          ...prev,
          revisions: prev.revisions.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }));
        logActivity({
          action: "Stand aktualisiert",
          entityType: "revision",
          entityId: id,
          detail: Object.keys(patch).join(", "),
        });
      },
      linkComponentToAssembly: (componentPartId, assemblyPartId) => {
        mutate((prev) => ({
          ...prev,
          parts: prev.parts.map((p) => {
            if (p.id !== componentPartId) return p;
            const existing = p.usedOnPartIds?.length
              ? p.usedOnPartIds
              : p.parentPartId
                ? [p.parentPartId]
                : [];
            if (existing.includes(assemblyPartId)) return p;
            return {
              ...p,
              usedOnPartIds: [...existing, assemblyPartId],
              parentPartId: p.parentPartId ?? assemblyPartId,
            };
          }),
        }));
        logActivity({
          action: "Profil an Bezug verknüpft",
          entityType: "part",
          entityId: componentPartId,
          detail: `→ ${assemblyPartId}`,
        });
      },
      startDevelopmentLoop: (partId, reason, options) => {
        const prev = state;
        if (!prev) return null;
        const part = prev.parts.find((p) => p.id === partId);
        if (!part) return null;
        const existing = prev.revisions.filter((r) => r.partId === partId);
        const next = nextRevisionNumber(existing, part.currentRevision);
        const previousStand = existing.find((r) => r.revision === part.currentRevision);

        let componentStands = previousStand?.componentStands;
        let extraRevisions: Revision[] = [];
        let extraPartUpdates: Record<string, string> = {};

        if (isAssemblyPart(part)) {
          const children = getChildComponents(prev.parts, partId);
          const base = carryOverComponentStands(previousStand, children);
          const decisions = options?.componentDecisions;

          if (decisions && decisions.length > 0) {
            const enriched = decisions.map((d) => {
              if (d.carryOver) return { ...d };
              const child = prev.parts.find((p) => p.id === d.partId);
              if (!child) return { ...d, nextRevision: undefined as string | undefined };
              const childRevs = prev.revisions.filter((r) => r.partId === d.partId);
              const childNext = nextRevisionNumber(childRevs, child.currentRevision);
              const childRev: Revision = {
                id: uid(),
                partId: d.partId,
                revision: childNext,
                title: `Mit Bezug Stand ${next} – Profil geändert`,
                date: new Date().toISOString().slice(0, 10),
                createdByUserId: prev.currentUserId,
                userType: "intern",
                reason: `Mitgeführt aus Bezug ${part.partNumber} Stand ${next}`,
                status: "in_entwicklung",
                basedOnRevision: child.currentRevision,
                drawings: [`ZW_${child.partNumber}_${childNext}_WIP.pdf`],
                photos: [],
                documents: [],
                bomItems: [],
                files: [`ZW_${child.partNumber}_${childNext}_WIP.pdf`],
              };
              extraRevisions.push(childRev);
              extraPartUpdates[d.partId] = childNext;
              return { ...d, nextRevision: childNext };
            });
            componentStands = applyComponentDecisions(base, enriched);
          } else {
            componentStands = base;
          }
        }

        const created: Revision = {
          id: uid(),
          partId,
          revision: next,
          title: `Entwicklungsschleife Stand ${next}`,
          date: new Date().toISOString().slice(0, 10),
          createdByUserId: prev.currentUserId,
          userType: "intern",
          reason: reason || "Neue Entwicklungsschleife",
          status: "in_entwicklung",
          basedOnRevision: part.currentRevision,
          drawings: [`ZW_${part.partNumber}_${next}_WIP.pdf`],
          photos: [],
          documents: [`Auftrag_Schleife_${next}.pdf`],
          bomItems: previousStand?.bomItems ?? [],
          files: [`ZW_${part.partNumber}_${next}_WIP.pdf`],
          componentStands,
          weightGrams: previousStand?.weightGrams,
        };

        const impact =
          isSharedComponent(part) || part.partKind === "profil" || part.partKind === "befestigung"
            ? getAssembliesUsing(prev.parts, partId)
            : [];

        mutate((s) => ({
          ...s,
          revisions: [
            ...s.revisions.map((r) => {
              if (r.partId === partId && r.status === "in_entwicklung") {
                return { ...r, status: "ersetzt" as const };
              }
              if (
                extraRevisions.some((er) => er.partId === r.partId) &&
                r.status === "in_entwicklung"
              ) {
                return { ...r, status: "ersetzt" as const };
              }
              return r;
            }),
            ...extraRevisions,
            created,
          ],
          parts: s.parts.map((p) => {
            if (p.id === partId) return { ...p, currentRevision: next };
            if (extraPartUpdates[p.id]) {
              return { ...p, currentRevision: extraPartUpdates[p.id] };
            }
            return p;
          }),
        }));
        logActivity({
          action: "Entwicklungsschleife gestartet",
          entityType: "revision",
          entityId: created.id,
          detail:
            impact.length > 0
              ? `Stand ${created.revision} – wirkt auf ${impact.map((a) => a.partNumber).join(", ")}`
              : `Stand ${created.revision}`,
        });
        return created;
      },
      relaunchStand: (partId, revisionId) => {
        mutate((prev) => {
          const rev = prev.revisions.find((r) => r.id === revisionId && r.partId === partId);
          if (!rev) return prev;
          return {
            ...prev,
            revisions: prev.revisions.map((r) => {
              if (r.id === revisionId) {
                return {
                  ...r,
                  status: "relaunched" as const,
                  relaunchedAt: new Date().toISOString(),
                  relaunchedByUserId: prev.currentUserId,
                };
              }
              if (
                r.partId === partId &&
                r.id !== revisionId &&
                (r.status === "relaunched" || r.status === "freigegeben")
              ) {
                return { ...r, status: "ersetzt" as const };
              }
              return r;
            }),
            parts: prev.parts.map((p) =>
              p.id === partId
                ? {
                    ...p,
                    currentRevision: rev.revision,
                    releasedRevision: rev.revision,
                  }
                : p,
            ),
          };
        });
        logActivity({
          action: "Relaunch / Stand freigegeben",
          entityType: "revision",
          entityId: revisionId,
          detail: partId,
        });
      },
      addPart: (part) => {
        const created: Part = { ...part, id: uid() };
        mutate((prev) => ({ ...prev, parts: [...prev.parts, created] }));
        logActivity({
          action: "Bauteil angelegt",
          entityType: "part",
          entityId: created.id,
          detail: `${created.partNumber} – ${created.name}`,
        });
        return created;
      },
      deletePart: (partId) => {
        const part = state.parts.find((p) => p.id === partId);
        mutate((prev) => ({
          ...prev,
          parts: prev.parts
            .filter((p) => p.id !== partId)
            .map((p) => {
              let next = p;
              if (p.mirrorPairPartId === partId) {
                next = {
                  ...next,
                  mirrorPairPartId: undefined,
                  mirrorMasterPartId:
                    next.mirrorMasterPartId === partId
                      ? undefined
                      : next.mirrorMasterPartId,
                  developmentRole:
                    next.developmentRole === "spiegel" ? "eigenstaendig" : next.developmentRole,
                };
              }
              if (p.mirrorMasterPartId === partId) {
                next = {
                  ...next,
                  mirrorMasterPartId: undefined,
                  developmentRole: "eigenstaendig",
                };
              }
              if (p.parentPartId === partId) {
                next = { ...next, parentPartId: undefined };
              }
              if (p.usedOnPartIds?.includes(partId)) {
                const used = p.usedOnPartIds.filter((id) => id !== partId);
                next = {
                  ...next,
                  usedOnPartIds: used.length ? used : undefined,
                  parentPartId:
                    next.parentPartId === partId
                      ? used[0]
                      : next.parentPartId,
                };
              }
              return next;
            }),
          revisions: prev.revisions
            .filter((r) => r.partId !== partId)
            .map((r) =>
              r.componentStands?.some((c) => c.partId === partId)
                ? {
                    ...r,
                    componentStands: r.componentStands.filter(
                      (c) => c.partId !== partId,
                    ),
                  }
                : r,
            ),
          tasks: prev.tasks.map((t) =>
            t.partId === partId ? { ...t, partId: undefined } : t,
          ),
          lops: prev.lops.map((l) =>
            l.partId === partId ? { ...l, partId: undefined } : l,
          ),
        }));
        logActivity({
          action: "Bauteil gelöscht",
          entityType: "part",
          entityId: partId,
          detail: part
            ? `${part.partNumber} – ${part.name}`
            : partId,
        });
      },
      deleteProject: (projectId) => {
        const project = state.projects.find((p) => p.id === projectId);
        const partIds = new Set(
          state.parts.filter((p) => p.projectId === projectId).map((p) => p.id),
        );
        mutate((prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== projectId),
          structureNodes: prev.structureNodes.filter(
            (n) => n.projectId !== projectId,
          ),
          parts: prev.parts.filter((p) => p.projectId !== projectId),
          revisions: prev.revisions.filter((r) => !partIds.has(r.partId)),
          tasks: prev.tasks.filter((t) => t.projectId !== projectId),
          lops: prev.lops.filter((l) => l.projectId !== projectId),
          approvals: prev.approvals.filter((a) => a.projectId !== projectId),
        }));
        logActivity({
          action: "Programm gelöscht",
          entityType: "project",
          entityId: projectId,
          detail: project
            ? `${project.customer} · ${project.code}`
            : projectId,
        });
      },
      addStructureNode: (node) => {
        const created: StructureNode = { ...node, id: uid() };
        mutate((prev) => ({
          ...prev,
          structureNodes: [...prev.structureNodes, created],
        }));
        logActivity({
          action: "Strukturknoten angelegt",
          entityType: "structure",
          entityId: created.id,
          detail: `${created.type}: ${created.label}`,
        });
        return created;
      },
      addSeatVariantWithModules: (input) => {
        const project = state.projects.find((p) => p.id === input.projectId);
        const siblings = state.structureNodes.filter(
          (n) => n.projectId === input.projectId && n.parentId === input.parentRowId,
        );
        const sortOrder = siblings.length + 1;
        const variantId = uid();
        const variant: StructureNode = {
          id: variantId,
          projectId: input.projectId,
          parentId: input.parentRowId,
          type: "sitzvariante",
          label: input.label.trim(),
          sortOrder,
        };
        const modules = modulesForScope(
          input.projectId,
          variantId,
          project?.supplyScope ?? "bezug",
        );
        mutate((prev) => ({
          ...prev,
          structureNodes: [...prev.structureNodes, variant, ...modules],
        }));
        logActivity({
          action: "Sitzart angelegt",
          entityType: "structure",
          entityId: variantId,
          detail: `${input.label} (+ Module)`,
        });
        return variant;
      },
      addCoverVariant: (input) => {
        let bezugModul = state.structureNodes.find(
          (n) =>
            n.projectId === input.projectId &&
            n.parentId === input.seatVariantId &&
            n.type === "modul" &&
            n.moduleKind === "bezug",
        );
        const extra: StructureNode[] = [];
        if (!bezugModul) {
          bezugModul = {
            id: uid(),
            projectId: input.projectId,
            parentId: input.seatVariantId,
            type: "modul",
            label: "Bezug",
            moduleKind: "bezug",
            sortOrder: 1,
          };
          extra.push(bezugModul);
        }
        const siblings = state.structureNodes.filter(
          (n) => n.parentId === bezugModul!.id,
        );
        const created: StructureNode = {
          id: uid(),
          projectId: input.projectId,
          parentId: bezugModul.id,
          type: "bezugvariante",
          label: input.label.trim(),
          sortOrder: siblings.length + extra.length + 1,
        };
        mutate((prev) => ({
          ...prev,
          structureNodes: [...prev.structureNodes, ...extra, created],
        }));
        logActivity({
          action: "Bezugvariante angelegt",
          entityType: "structure",
          entityId: created.id,
          detail: created.label,
        });
        return created;
      },
      addConfiguredProject: (config) => {
        const projectId = uid();
        const code = config.code.trim().toUpperCase();
        const name = config.name.trim() || `Programm ${code}`;
        const customer = config.customer.trim() || "Kunde";
        const equipment = [...new Set(config.equipment)];
        const headrestText = config.includesHeadrest
          ? " Inkl. Kopfstützen-Entwicklung."
          : " Ohne Kopfstützen-Entwicklung.";
        const equipText =
          equipment.length > 0
            ? ` Ausstattung: ${equipment
                .map((id) => {
                  const map: Record<string, string> = {
                    sitzheizung: "Sitzheizung",
                    sitzlueftung: "Sitzlüftung",
                    massage: "Massage",
                    memory: "Memory",
                    airbag: "Seitenairbag",
                    lordose: "Lordosenstütze",
                    durchlade: "Durchlade",
                  };
                  return map[id] ?? id;
                })
                .join(", ")}.`
            : "";
        const project: SeatHubState["projects"][0] = {
          id: projectId,
          code,
          name,
          customer,
          status: "entwicklung",
          ampel: "gelb",
          locations: config.locations?.length
            ? config.locations
            : ["hannover"],
          description:
            (config.description?.trim() ||
              `${supplyScopeLabel[config.supplyScope]} – Struktur aus Konfigurator.`) +
            headrestText +
            equipText,
          supplyScope: config.supplyScope,
          equipment,
          sopDate: config.sopDate,
          includesHeadrest: config.includesHeadrest,
        };

        const nodes: StructureNode[] = [];
        config.rows.forEach((row, ri) => {
          const rowId = uid();
          nodes.push({
            id: rowId,
            projectId,
            parentId: null,
            type: "sitzreihe",
            label: row.label.trim() || `${ri + 1}. Reihe`,
            sortOrder: ri + 1,
          });
          row.seats.forEach((seat, si) => {
            const seatId = uid();
            const seatLabel = seatDisplayLabel(seat);
            const sideHint =
              seat.sideMode === "lr"
                ? " (L/R)"
                : seat.sideMode === "mitte"
                  ? " (Mitte)"
                  : " (einzeln)";
            nodes.push({
              id: seatId,
              projectId,
              parentId: rowId,
              type: "sitzvariante",
              label: `${seatLabel}${sideHint}`,
              sortOrder: si + 1,
            });
            const modules = modulesForScope(projectId, seatId, config.supplyScope);
            nodes.push(...modules);
            const bezugModul = modules.find((m) => m.moduleKind === "bezug")!;
            expandCoverLabels(seat).forEach((coverLabel, ci) => {
              nodes.push({
                id: uid(),
                projectId,
                parentId: bezugModul.id,
                type: "bezugvariante",
                label: coverLabel,
                sortOrder: ci + 1,
              });
            });
          });
        });

        mutate((prev) => ({
          ...prev,
          projects: [project, ...prev.projects],
          structureNodes: [...prev.structureNodes, ...nodes],
        }));
        logActivity({
          action: "Programm angelegt",
          entityType: "project",
          entityId: projectId,
          detail: `${customer} · ${code} · ${config.rows.length} Reihen${
            config.templateId ? ` · Vorlage ${config.templateId}` : ""
          }`,
        });
        return project;
      },
      saveProgramTemplate: (tpl) => {
        const created: ProgramTemplate = {
          ...tpl,
          id: tpl.id ?? uid(),
          name: tpl.name.trim(),
          description: tpl.description.trim(),
          custom: true,
          rows: structuredClone(tpl.rows),
          equipment: [...tpl.equipment],
        };
        mutate((prev) => ({
          ...prev,
          programTemplates: [
            created,
            ...(prev.programTemplates ?? []).filter((t) => t.id !== created.id),
          ],
        }));
        logActivity({
          action: "Programm-Vorlage gespeichert",
          entityType: "template",
          entityId: created.id,
          detail: created.name,
        });
        return created;
      },
      deleteProgramTemplate: (id) => {
        mutate((prev) => ({
          ...prev,
          programTemplates: (prev.programTemplates ?? []).filter((t) => t.id !== id),
        }));
      },
      addLeftRightPair: (input) => {
        const masterId = uid();
        const mirrorId = uid();
        const otherSide = input.developSide === "links" ? "rechts" : "links";
        const masterNumber =
          input.developSide === "links" ? input.partNumberLeft : input.partNumberRight;
        const mirrorNumber =
          input.developSide === "links" ? input.partNumberRight : input.partNumberLeft;
        const master: Part = {
          id: masterId,
          projectId: input.projectId,
          structureNodeId: input.structureNodeId,
          partNumber: masterNumber,
          name: `${input.baseName} ${input.developSide === "links" ? "Links" : "Rechts"}`,
          side: input.developSide,
          moduleKind: input.moduleKind ?? "bezug",
          engineerUserId: input.engineerUserId,
          coverDeveloperUserId: input.coverDeveloperUserId,
          currentRevision: "01",
          developmentRole: "entwickelt",
          mirrorPairPartId: mirrorId,
        };
        const mirror: Part = {
          id: mirrorId,
          projectId: input.projectId,
          structureNodeId: input.structureNodeId,
          partNumber: mirrorNumber,
          name: `${input.baseName} ${otherSide === "links" ? "Links" : "Rechts"}`,
          side: otherSide,
          moduleKind: input.moduleKind ?? "bezug",
          engineerUserId: input.engineerUserId,
          coverDeveloperUserId: input.coverDeveloperUserId,
          currentRevision: "01",
          developmentRole: "spiegel",
          mirrorMasterPartId: masterId,
          mirrorPairPartId: masterId,
        };
        mutate((prev) => ({ ...prev, parts: [...prev.parts, master, mirror] }));
        logActivity({
          action: "L/R-Paar angelegt",
          entityType: "part",
          entityId: masterId,
          detail: `${master.partNumber} (entwickelt) + ${mirror.partNumber} (Spiegel)`,
        });
        return { master, mirror };
      },
      updateApproval: (id, patch) => {
        mutate((prev) => ({
          ...prev,
          approvals: prev.approvals.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }));
        logActivity({
          action: "Freigabe aktualisiert",
          entityType: "approval",
          entityId: id,
        });
      },
      getProject: (id) => state.projects.find((p) => p.id === id),
      getPart: (id) => state.parts.find((p) => p.id === id),
      getUser: (id) => state.users.find((u) => u.id === id),
    };
  }, [state, hydrated, mutate, logActivity]);

  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--ink-muted)]">
        SeatHub wird geladen…
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
