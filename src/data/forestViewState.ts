export type ForestCameraViewState = {
  theta: number;
  phi: number;
  r: number;
  target: {
    x: number;
    y: number;
  };
};

export type StoredForestViewState = {
  version: 1;
  key: string;
  createdAt: number;
  reason?: string;
  view: ForestCameraViewState;
};

export const FOREST_VIEW_STATE_KEY = 'forest:ai:viewState';
export const FOREST_VIEW_RESTORE_MAX_AGE_MS = 30 * 60 * 1000;

export type ForestViewLocationState = {
  forestViewRestoreKey?: string;
};

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isForestCameraViewState(value: unknown): value is ForestCameraViewState {
  if (!isRecord(value) || !isRecord(value.target)) return false;
  return finiteNumber(value.theta)
    && finiteNumber(value.phi)
    && finiteNumber(value.r)
    && finiteNumber(value.target.x)
    && finiteNumber(value.target.y);
}

function isStoredForestViewState(value: unknown): value is StoredForestViewState {
  return isRecord(value)
    && value.version === 1
    && typeof value.key === 'string'
    && value.key.length > 0
    && finiteNumber(value.createdAt)
    && isForestCameraViewState(value.view);
}

function createRestoreKey(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${randomPart}`;
}

export function saveForestViewState(view: ForestCameraViewState, reason?: string): StoredForestViewState | null {
  const store = storage();
  if (!store || !isForestCameraViewState(view)) return null;
  const payload: StoredForestViewState = {
    version: 1,
    key: createRestoreKey(),
    createdAt: Date.now(),
    reason,
    view,
  };
  try {
    store.setItem(FOREST_VIEW_STATE_KEY, JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

function parseStoredForestViewState(): StoredForestViewState | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(FOREST_VIEW_STATE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isStoredForestViewState(parsed)) return parsed;
  } catch {
    // Ignore malformed state and clear it below.
  }
  clearForestViewState();
  return null;
}

export function readForestViewState(options: {
  key?: string | null;
  maxAgeMs?: number;
} = {}): StoredForestViewState | null {
  const payload = parseStoredForestViewState();
  if (!payload) return null;

  const maxAgeMs = options.maxAgeMs ?? FOREST_VIEW_RESTORE_MAX_AGE_MS;
  if (Date.now() - payload.createdAt > maxAgeMs) {
    clearForestViewState();
    return null;
  }

  if (!options.key || payload.key !== options.key) {
    return null;
  }

  return payload;
}

export function peekForestViewRestoreKey(): string | null {
  return parseStoredForestViewState()?.key ?? null;
}

export function consumeForestViewState(key?: string | null): void {
  const store = storage();
  if (!store) return;
  if (key) {
    const payload = parseStoredForestViewState();
    if (payload && payload.key !== key) return;
  }
  store.removeItem(FOREST_VIEW_STATE_KEY);
}

export function clearForestViewState(): void {
  const store = storage();
  if (!store) return;
  store.removeItem(FOREST_VIEW_STATE_KEY);
}

export function forestViewRestoreLocationState(key?: string | null): ForestViewLocationState | undefined {
  return key ? { forestViewRestoreKey: key } : undefined;
}

export function getForestViewRestoreKey(state: unknown): string | null {
  if (!isRecord(state)) return null;
  const key = state.forestViewRestoreKey;
  return typeof key === 'string' && key.length > 0 ? key : null;
}

export function markCurrentForestHistoryEntryForRestore(key: string): void {
  if (typeof window === 'undefined' || !key) return;
  try {
    const current = isRecord(window.history.state) ? window.history.state : {};
    const currentUserState = isRecord(current.usr) ? current.usr : {};
    window.history.replaceState(
      {
        ...current,
        usr: {
          ...currentUserState,
          forestViewRestoreKey: key,
        },
      },
      document.title,
    );
  } catch {
    // History state is an optimization for browser back; button return still carries state.
  }
}
