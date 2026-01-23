import { promises as fs } from "fs";
import path from "path";

export interface State {
  lastSeen: Record<string, number>;
  seenTrades: Record<string, number>;
  dailyVolume: {
    day: string;
    spentUsd: number;
  };
  redeemAttempts: Record<string, number>;
}

const defaultState = (): State => ({
  lastSeen: {},
  seenTrades: {},
  dailyVolume: {
    day: "",
    spentUsd: 0,
  },
  redeemAttempts: {},
});

const dayKeyUtc = (date = new Date()): string => {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const loadState = async (filePath: string): Promise<State> => {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as State;
    return {
      ...defaultState(),
      ...parsed,
      lastSeen: parsed.lastSeen ?? {},
      seenTrades: parsed.seenTrades ?? {},
      dailyVolume: parsed.dailyVolume ?? { day: "", spentUsd: 0 },
      redeemAttempts: parsed.redeemAttempts ?? {},
    };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return defaultState();
    throw err;
  }
};

export const saveState = async (filePath: string, state: State): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(state, null, 2));
};

export const ensureDailyVolume = (state: State, now = new Date()): void => {
  const key = dayKeyUtc(now);
  if (state.dailyVolume.day !== key) {
    state.dailyVolume.day = key;
    state.dailyVolume.spentUsd = 0;
  }
};

export const noteSeenTrade = (state: State, tradeKey: string, timestamp: number): void => {
  state.seenTrades[tradeKey] = timestamp;
};

export const pruneSeenTrades = (state: State, maxAgeSec: number): void => {
  const cutoff = Math.floor(Date.now() / 1000) - maxAgeSec;
  for (const [key, ts] of Object.entries(state.seenTrades)) {
    if (ts < cutoff) delete state.seenTrades[key];
  }
};

export const markRedeemAttempt = (state: State, conditionId: string): void => {
  state.redeemAttempts[conditionId] = Math.floor(Date.now() / 1000);
};
