import { createSeedState } from "./seed";
import type { Lop, LopHistoryEntry, SeatHubState } from "./types";

export const STORAGE_KEY = "seathub-prototype-v14";

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

function normalize(state: SeatHubState): SeatHubState {
  return {
    ...state,
    lops: state.lops.map((l) => ({
      ...l,
      photos: l.photos ?? [],
      history: historyFromLegacy(l),
      steps: undefined,
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
