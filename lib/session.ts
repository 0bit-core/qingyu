import { getStore } from "./store";
import type { Branch, SessionState, SummaryOutput } from "./types";

// 会话状态读写。sessionId 由 httpOnly cookie 承载（brief §2），前端只透传。

export const SESSION_COOKIE = "qingyu_sid";
/** 与 lib/store.ts 的 TTL、/about 的对外说明保持一致：约 2 小时 */
export const SESSION_TTL_SECONDS = 2 * 60 * 60;
/** 对话历史最多保留的条数（旧轮截断，降低提示词与内存负担） */
export const MAX_TURNS = 40;

export function emptySummary(): SummaryOutput {
  return {
    mood_trend: "持平",
    current_intensity: 0,
    recurring_themes: [],
    what_helped: [],
    risk_flag: "none",
    risk_note: "无",
    stage: "explore",
    open_loop: "无",
  };
}

export async function createSession(branch: Branch | null): Promise<SessionState> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const state: SessionState = {
    id,
    createdAt: now,
    updatedAt: now,
    entryBranch: branch,
    stage: branch === "stabilize" ? "stabilize" : branch === "action" ? "action" : "explore",
    turns: [],
    riskFlag: "none",
    riskNote: "无",
    noRiskStreak: 0,
    denied: false,
    validationOnlyStreak: 0,
    ruminationRounds: 0,
    userStateSummary: emptySummary(),
    mock: { freeReplyIdx: 0, lastCard: null, lastMood: null },
    recentActions: [],
  };
  await getStore().set(id, state);
  return state;
}

export async function getSession(
  id: string | null | undefined,
): Promise<SessionState | undefined> {
  if (!id) return undefined;
  return getStore().get(id);
}

export async function saveSession(state: SessionState): Promise<void> {
  state.updatedAt = Date.now();
  state.turns = state.turns.slice(-MAX_TURNS);
  await getStore().set(state.id, state);
}

export async function deleteSession(id: string): Promise<void> {
  await getStore().delete(id);
}
