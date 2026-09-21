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
import { uid } from "./labels";
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
import type {
  Activity,
  Approval,
  DemoRole,
  Lop,
  LopHistoryEntry,
  Part,
  Revision,
  SeatHubState,
  StructureNode,
  Substitution,
  Task,
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
        const created: Task = {
          ...task,
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        mutate((prev) => ({ ...prev, tasks: [created, ...prev.tasks] }));
        logActivity({
          action: "Aufgabe angelegt",
          entityType: "task",
          entityId: created.id,
          detail: created.title,
        });
        return created;
      },
      updateTask: (id, patch) => {
        mutate((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...patch };
            if (
              (patch.status === "in_bearbeitung" || patch.status === "zur_pruefung") &&
              !next.startedAt
            ) {
              next.startedAt = new Date().toISOString();
            }
            if (
              (patch.status === "erledigt" || patch.status === "abgeschlossen") &&
              !next.completedAt
            ) {
              next.completedAt = new Date().toISOString();
              if (next.progress < 100) next.progress = 100;
            }
            return next;
          }),
        }));
        logActivity({
          action: "Aufgabe aktualisiert",
          entityType: "task",
          entityId: id,
          detail: Object.keys(patch).join(", "),
        });
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
        const modules: StructureNode[] = [
          {
            id: uid(),
            projectId: input.projectId,
            parentId: variantId,
            type: "modul",
            label: "Bezug",
            moduleKind: "bezug",
            sortOrder: 1,
          },
        ];
        const scope = project?.supplyScope ?? "bezug";
        if (scope === "bezug_schnittstelle") {
          modules.push({
            id: uid(),
            projectId: input.projectId,
            parentId: variantId,
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
              projectId: input.projectId,
              parentId: variantId,
              type: "modul",
              label: "Kunststoff",
              moduleKind: "kunststoff",
              sortOrder: 2,
            },
            {
              id: uid(),
              projectId: input.projectId,
              parentId: variantId,
              type: "modul",
              label: "Schaum",
              moduleKind: "schaum",
              sortOrder: 3,
            },
            {
              id: uid(),
              projectId: input.projectId,
              parentId: variantId,
              type: "modul",
              label: "Struktur / Metall",
              moduleKind: "struktur",
              sortOrder: 4,
            },
          );
        }
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
