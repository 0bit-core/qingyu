import { callLlm, isMockMode } from "./llm";
import { fill, loadPrompt } from "./prompts";
import type { Battery, MicroAction } from "./types";

// 微动作卡片生成器（brief 方案确认项）：
// 真实模式下按对话上下文生成单步小动作卡；mock 模式返回 null（调用方降级静态库）。
// 三层安全：L6_card 提示词约束 → cardGuard 确定性检查 → 失败静默降级。

export type CardGoal = "sense" | "move";
export type CardKind = "sense" | "move" | "breath";
export type GeneratedCard = { card: MicroAction; kind: CardKind };

// 危险/越界动作词：出现即拒（宁可降级静态库，也不推不合适的动作）
const DANGEROUS =
  /跑(步|步机|远)?|游泳|爬(山|楼|高|梯)?|骑行|骑车|开车|酒|酒精|药|刀|剪|马路|深水|高空|阳台外|挨饿|节食|憋气|倒立| fasting/i;
// 不施压 / 规范用词
const FORBIDDEN = /练习|训练|疗程|评估|打卡|任务|指标|必须|要坚持|建议你每天/;

function cardGuard(raw: unknown): GeneratedCard | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const body = typeof o.body === "string" ? o.body.trim() : "";
  const kind: CardKind | null =
    o.kind === "sense" || o.kind === "move" || o.kind === "breath" ? o.kind : null;
  if (!title || !body || !kind) return null;
  // 长度闸：单步、一句话
  if (title.length > 16 || body.length > 42) return null;
  if (/[\n\r]/.test(title) || /[\n\r]/.test(body)) return null;
  if (DANGEROUS.test(title + body) || FORBIDDEN.test(title + body)) return null;
  return {
    kind,
    card: { id: `ai-${kind}-${Date.now().toString(36)}`, title, body },
  };
}

export async function generateActionCard(opts: {
  sessionId: string;
  turn: number;
  goal: CardGoal;
  battery?: Battery;
  recentActions: string[];
  recentTurns: string;
  summary: string;
}): Promise<GeneratedCard | null> {
  if (isMockMode()) return null;
  try {
    const system = fill(await loadPrompt("L6_card"), {
      card_goal: opts.goal,
      battery: String(opts.battery ?? "-"),
      recent_turns: opts.recentTurns || "（无）",
      user_state_summary: opts.summary,
      recent_actions: opts.recentActions.length
        ? opts.recentActions.join("、")
        : "（无）",
    });
    const raw = await callLlm<unknown>({
      purpose: "card",
      sessionId: opts.sessionId,
      turn: opts.turn,
      system,
      user: "请生成一张卡片。",
      json: true,
      small: true,
      mock: () => null,
    });
    const gen = cardGuard(raw);
    if (!gen) {
      // 不打错——guard 拒绝是正常路径，降级静态库
      return null;
    }
    return gen;
  } catch {
    // 调用失败/超时：静默降级（callLlm 已记录 error 日志）
    return null;
  }
}
