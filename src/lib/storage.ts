// Thin wrapper around localStorage for the Anthropic API key and the last
// fetched yield snapshot. localStorage is the only persistence mechanism we
// have on a static GitHub Pages deploy.

const KEYS = {
  apiKey: "cyo.anthropicApiKey",
  yieldsSnapshot: "cyo.yieldsSnapshot",
  lastInputs: "cyo.lastInputs",
} as const;

export interface YieldSnapshot {
  fetchedAt: string; // ISO timestamp
  yields: Record<string, number>; // ticker -> 7-day yield (percent)
  source: "claude-web-search" | "manual" | "seed";
  notes?: string;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* swallow quota / private mode errors */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

export function getApiKey(): string | null {
  return safeGet(KEYS.apiKey);
}

export function setApiKey(key: string): void {
  safeSet(KEYS.apiKey, key.trim());
}

export function clearApiKey(): void {
  safeRemove(KEYS.apiKey);
}

export function getYieldsSnapshot(): YieldSnapshot | null {
  const raw = safeGet(KEYS.yieldsSnapshot);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as YieldSnapshot;
    if (parsed && typeof parsed.fetchedAt === "string" && parsed.yields) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setYieldsSnapshot(snapshot: YieldSnapshot): void {
  safeSet(KEYS.yieldsSnapshot, JSON.stringify(snapshot));
}

export function clearYieldsSnapshot(): void {
  safeRemove(KEYS.yieldsSnapshot);
}

export interface SavedInputs {
  qualifiedAccount: boolean;
  federalRatePct: number;
  stateRatePct: number;
  userState: string;
  niitApplies: boolean;
  custodianPreference: string;
  investmentAmount: number;
}

export function getSavedInputs(): SavedInputs | null {
  const raw = safeGet(KEYS.lastInputs);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedInputs;
  } catch {
    return null;
  }
}

export function setSavedInputs(inputs: SavedInputs): void {
  safeSet(KEYS.lastInputs, JSON.stringify(inputs));
}
