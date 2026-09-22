import { createSeedState } from "./seed";
import type { Lop, LopHistoryEntry, SeatHubState, Task } from "./types";

export const STORAGE_KEY = "seathub-prototype-v20";

function historyFromLegacy(lop: Lop): LopHistoryEntry[] {
  if (lop.history?.length) return lop.history;
  const fromSteps = (lop.steps ?? [])
    .filter((s) => s.done)
    .map((s, i) => ({
      id: s.id || `legacy-${lop.id}-${i}`,
      at: s.at ? `${s.at}T12:00:00.000Z` : lop.createdAt,
      actorUserId: lop.createdByUserId,
      action: s.label,
    }));
  if (fromSteps.length) return fromSteps;
  return [
    {
      id: `created-${lop.id}`,
      at: lop.createdAt,
      actorUserId: lop.createdByUserId,
      action: "Erstellt",
    },
  ];
}

function taskHistoryFromLegacy(task: Task): NonNullable<Task["history"]> {
  if (task.history?.length) return task.history;
  return [
    {
      id: `created-${task.id}`,
      at: task.createdAt,
      actorUserId: task.createdByUserId ?? "",
      action: "Auftrag angelegt",
      detail: task.title,
    },
  ];
}

function normalize(state: SeatHubState): SeatHubState {
  const seed = createSeedState();
  return {
    ...state,
    projects: (state.projects ?? []).map((p) => ({
      ...p,
      equipment: p.equipment ?? [],
      sopDate: p.sopDate,
      includesHeadrest: p.includesHeadrest,
    })),
    programTemplates: state.programTemplates ?? [],
    flows: state.flows?.length ? state.flows : seed.flows,
    agents: state.agents?.length ? state.agents : seed.agents,
    agentInsights: state.agentInsights?.length
      ? state.agentInsights
      : seed.agentInsights,
    lops: state.lops.map((l) => ({
      ...l,
      photos: l.photos ?? [],
      history: historyFromLegacy(l),
      steps: undefined,
    })),
    tasks: (state.tasks ?? []).map((t) => ({
      ...t,
      history: taskHistoryFromLegacy(t),
      checklist: t.checklist ?? [],
    })),
  };
}

export function loadState(): SeatHubState {
  if (typeof window === "undefined") {
    return createSeedState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return normalize(JSON.parse(raw) as SeatHubState);
  } catch {
    const seed = createSeedState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveState(state: SeatHubState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): SeatHubState {
  const seed = createSeedState();
  saveState(seed);
  return seed;
}
