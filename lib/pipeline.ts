import { emergencyMessage } from "@/config/emergency";
import { localeResourcesText } from "@/config/resources";
import { generalFallback, safetyFallback } from "./fallback";
import { callLlm, isMockMode } from "./llm";
import { generateActionCard } from "./cardGen";
import { logPipeline } from "./logger";
import { loadPrompt, fill, stagePromptName } from "./prompts";
import { maxRisk, ruleRisk, stepDownRisk, DENIAL_PATTERN, type RuleHit } from "./riskRules";
import { styleGuard } from "./styleGuard";
import {
  createSession,
  getSession,
  saveSession,
} from "./session";
import {
  cardActionReply,
  describeCardAction,
  mockMainReply,
  mockReview,
  mockRouter,
  mockSummary,
  stabilizeActions,
} from "./mockContent";
import type {
  Branch,
  CardAction,
  CardPayload,
  ChatResponse,
  ReviewOutput,
  RouterOutput,
  SessionState,
  Stage,
  SummaryOutput,
} from "./types";

// 每轮处理链路（brief §5，顺序不可合并）：
// 1. 风险分类器（小模型 + 规则兜底，取高）
// 2. 读取状态摘要
// 3. 主生成（按 risk_level 与 stage 注入阶段提示词；≥ elevated 时 L3_safety 替换）
// 4. 输出审查（小模型）→ 不通过按 rewrite_hint 重写一次 → 仍不过 → 人工审定兜底
// 5. 摘要更新（小模型）→ 写回会话
// 卡片交互（选天气/电量/换一张/不想做/做完）走人工审定固定话术，不经 LLM。

const CONTEXT_TURNS = 6;
const INPUT_MAX = 2000;

/** 最近 k 轮对话文本（k 轮 = 2k 条消息；L2 的 {k} 与此一致） */
function historyText(session: SessionState, k: number = CONTEXT_TURNS): string {
  return session.turns
    .slice(-k * 2)
    .map((t) => `${t.role === "user" ? "用户" : "轻屿"}：${t.content}`)
    .join("\n");
}

/** 记录最近推过的动作卡标题（AI 生成与 mock 挑选共用去重依据） */
function trackActionTitle(session: SessionState, cards: CardPayload[]): void {
  const first = cards[0];
  if (first?.type === "action") {
    const title = first.list[first.index]?.title;
    if (title) {
      session.recentActions = [
        title,
        ...session.recentActions.filter((t) => t !== title),
      ].slice(0, 5);
    }
  }
}

function promptVars(session: SessionState) {
  return {
    locale_resources: localeResourcesText(),
    emergency_message: emergencyMessage,
    user_state_summary: JSON.stringify(session.userStateSummary),
  };
}

// ---------------- 1. 风险分类器 ----------------

function mergeRouterWithRule(out: RouterOutput, hit: RuleHit | null): RouterOutput {
  if (!hit) return out;
  const merged = maxRisk(out.risk_level, hit.level);
  if (merged === out.risk_level) return out;
  return { ...out, risk_level: merged, risk_evidence: hit.evidence };
}

async function runRouter(
  session: SessionState,
  turnNo: number,
  input: string,
): Promise<RouterOutput> {
  const hit = ruleRisk(input);
  try {
    const system = fill(await loadPrompt("L2_router"), {
      k: String(CONTEXT_TURNS),
      user_state_summary: JSON.stringify(session.userStateSummary),
    });
    const user = [
      `最近对话：\n${historyText(session) || "（无）"}`,
      `本轮用户输入：${input}`,
    ].join("\n\n");
    const out = await callLlm<RouterOutput>({
      purpose: "risk",
      sessionId: session.id,
      turn: turnNo,
      system,
      user,
      json: true,
      small: true,
      mock: () => mockRouter(input, session),
    });
    return mergeRouterWithRule(out, hit);
  } catch {
    // 分类器通道失败 → 规则通道兜底：安全通道必须活着（brief §7.1）
    const out = mockRouter(input, session);
    if (hit) {
      out.risk_level = hit.level;
      out.risk_evidence = hit.evidence;
    }
    return out;
  }
}

// ---------------- 3. 阶段决策 ----------------

function decideStage(
  session: SessionState,
  router: RouterOutput,
): { stage: Stage; safeMode: boolean; resistance: boolean } {
  // 风险聚合用会话级标记（只升不降），决策取双方最高
  const risk = maxRisk(router.risk_level, session.riskFlag);
  if (risk === "elevated" || risk === "high" || risk === "crisis") {
    return { stage: "safety", safeMode: true, resistance: false };
  }
  // overload 强制稳定化（brief §5 硬性要求）
  if (router.overload) {
    return { stage: "stabilize", safeMode: false, resistance: false };
  }
  // resistance 不推进阶段：保持当前或退回探索
  if (router.resistance) {
    const current: Stage = session.stage === "off_topic" ? "explore" : session.stage;
    return { stage: current, safeMode: false, resistance: true };
  }
  const signal = router.stage_signal;
  if (signal === "safety" || signal === "off_topic") {
    const current: Stage = session.stage === "off_topic" ? "explore" : session.stage;
    return { stage: current, safeMode: false, resistance: false };
  }
  // 反刍/只共情连续 ≥3 轮 → 探索中引入轻重构（brief L2 规则 6）
  if (
    (session.ruminationRounds >= 3 || session.validationOnlyStreak >= 3) &&
    session.stage === "explore" &&
    signal === "explore"
  ) {
    return { stage: "insight", safeMode: false, resistance: false };
  }
  return { stage: signal, safeMode: false, resistance: false };
}

// ---------------- 4. 主生成 ----------------

function stageCards(stage: Stage): CardPayload[] {
  // 卡片由管线按阶段附加（结构性 UI 不交给生成模型；M3 打磨卡片意图识别）
  if (stage === "stabilize") {
    return [{ type: "action", list: stabilizeActions, index: 0 }];
  }
  if (stage === "action") return [{ type: "battery" }];
  return [];
}

type MainResult = { reply: string; cards: CardPayload[]; fallback?: boolean };

async function runMainOnce(
  session: SessionState,
  turnNo: number,
  input: string,
  stage: Stage,
  rewriteHint?: string,
  previousCandidate?: string,
  cardHint?: string,
): Promise<string> {
  const system = fill(
    [
      await loadPrompt("L0_safety"),
      await loadPrompt("L1_style"),
      await loadPrompt(stagePromptName(stage)),
    ].join("\n\n"),
    promptVars(session),
  );
  const parts = [
    `最近对话：\n${historyText(session) || "（无）"}`,
    `本轮用户输入：${input}`,
  ];
  if (previousCandidate && rewriteHint) {
    parts.push(
      `你上一版的回复：${previousCandidate}`,
      `重写方向：${rewriteHint}`,
    );
  }
  if (cardHint) {
    parts.push(`本轮的配套动作卡是《${cardHint}》，回复里承接它即可，不要再提出别的动作。`);
  }
  return callLlm<string>({
    purpose: rewriteHint ? "rewrite" : "main",
    sessionId: session.id,
    turn: turnNo,
    system,
    user: parts.join("\n\n"),
    json: false,
    small: false,
    mock: () => "",
  });
}

async function runMain(
  session: SessionState,
  turnNo: number,
  input: string,
  decision: { stage: Stage; safeMode: boolean; resistance: boolean },
): Promise<MainResult> {
  // 安全分支是替换式（brief §7.4）：L3_safety 替换阶段提示词；
  // mock 与生成失败都落到人工审定的固定安全文案
  if (decision.safeMode) {
    if (isMockMode()) {
      // 走 callLlm 包装，保证 main 段日志在 mock 下也可观测
      return callLlm<MainResult>({
        purpose: "main",
        sessionId: session.id,
        turn: turnNo,
        system: "",
        user: "",
        json: false,
        small: false,
        mock: () => ({ reply: safetyFallback(), cards: [] }),
      });
    }
    try {
      const reply = await runMainOnce(session, turnNo, input, "safety");
      return { reply, cards: [] };
    } catch {
      return { reply: safetyFallback(), cards: [], fallback: true };
    }
  }

  if (isMockMode()) {
    // mock 主生成也走 callLlm 包装，保证 main 段日志可观测
    return callLlm<MainResult>({
      purpose: "main",
      sessionId: session.id,
      turn: turnNo,
      system: "",
      user: "",
      json: false,
      small: false,
      mock: () =>
        mockMainReply({
          session,
          stage: decision.stage,
          input,
          resistance: decision.resistance,
        }),
    });
  }

  try {
    // 稳定化阶段先出卡，再让主生成承接同一张卡（保证「一次只给一个动作」）
    if (decision.stage === "stabilize") {
      const gen = await generateActionCard({
        sessionId: session.id,
        turn: turnNo,
        goal: "sense",
        recentActions: session.recentActions,
        recentTurns: historyText(session),
        summary: JSON.stringify(session.userStateSummary),
      });
      const reply = await runMainOnce(
        session,
        turnNo,
        input,
        decision.stage,
        undefined,
        undefined,
        gen ? `${gen.card.title}：${gen.card.body}` : undefined,
      );
      if (gen) return { reply, cards: [{ type: "action", list: [gen.card], index: 0 }] };
      return { reply, cards: stageCards(decision.stage) };
    }
    const reply = await runMainOnce(session, turnNo, input, decision.stage);
    return { reply, cards: stageCards(decision.stage) };
  } catch {
    return { reply: generalFallback, cards: [], fallback: true };
  }
}

// ---------------- 5. 输出审查 ----------------

function reviewUserText(
  input: string,
  candidate: string,
  decision: { stage: Stage; safeMode: boolean },
): string {
  return JSON.stringify({
    user_input: input,
    candidate_reply: candidate,
    risk_level: decision.safeMode ? "elevated" : "none",
    stage: decision.stage,
  });
}

async function reviewOnce(
  session: SessionState,
  turnNo: number,
  input: string,
  candidate: string,
  decision: { stage: Stage; safeMode: boolean },
): Promise<ReviewOutput> {
  return callLlm<ReviewOutput>({
    purpose: "review",
    sessionId: session.id,
    turn: turnNo,
    system: await loadPrompt("L5_review"),
    user: reviewUserText(input, candidate, decision),
    json: true,
    small: true,
    mock: () => mockReview(),
  });
}

async function runReview(
  session: SessionState,
  turnNo: number,
  input: string,
  candidate: MainResult,
  decision: { stage: Stage; safeMode: boolean },
): Promise<MainResult> {
  if (candidate.fallback) return candidate; // 已是人工审定兜底，无需再审

  if (decision.safeMode) {
    // 安全内容只校验一次，不通过/失败 → 固定安全兜底（不对安全内容做生成式重写）
    try {
      const verdict = await reviewOnce(session, turnNo, input, candidate.reply, decision);
      if (!verdict.pass) {
        return { reply: safetyFallback(), cards: [], fallback: true };
      }
      return candidate;
    } catch {
      return { reply: safetyFallback(), cards: [], fallback: true };
    }
  }

  if (isMockMode()) {
    // mock 审查也走一次（恒通过），保证 review 段日志可观测
    await reviewOnce(session, turnNo, input, candidate.reply, decision);
    return candidate;
  }

  try {
    const verdict = await reviewOnce(session, turnNo, input, candidate.reply, decision);
    // 第三道闸：L5 语义审查通过后，再做确定性规范检查（诊断词/禁语/清单/长度）
    const merged = verdict.pass ? styleGuard(candidate.reply) : verdict;
    if (merged.pass) return candidate;

    // 按 rewrite_hint 重写一次
    logPipeline({
      sessionId: session.id,
      turn: turnNo,
      stage: "rewrite",
      detail: { reason: merged.reason, hint: merged.rewrite_hint },
    });
    try {
      const rewritten = await runMainOnce(
        session,
        turnNo,
        input,
        decision.stage,
        merged.rewrite_hint,
        candidate.reply,
      );
      const verdict2 = await reviewOnce(session, turnNo, input, rewritten, decision);
      const merged2 = verdict2.pass ? styleGuard(rewritten) : verdict2;
      if (merged2.pass) return { reply: rewritten, cards: candidate.cards };
    } catch {
      /* 重写通道失败，走兜底 */
    }
    return { reply: generalFallback, cards: [], fallback: true };
  } catch {
    // 审查通道失败：按 brief §5 降级为预设安全回复
    return { reply: generalFallback, cards: [], fallback: true };
  }
}

// ---------------- 6. 摘要更新 ----------------

async function runSummary(
  session: SessionState,
  turnNo: number,
  input: string,
  router: RouterOutput,
  reply: string,
): Promise<SummaryOutput> {
  try {
    if (isMockMode()) {
      // mock 摘要也走 callLlm 包装，保证 summary 段日志可观测
      return await callLlm<SummaryOutput>({
        purpose: "summary",
        sessionId: session.id,
        turn: turnNo,
        system: "",
        user: "",
        json: true,
        small: true,
        mock: () => mockSummary(session, router),
      });
    }
    const system = fill(await loadPrompt("L4_summary"), {
      user_state_summary: JSON.stringify(session.userStateSummary),
    });
    const user = [
      `旧摘要：${JSON.stringify(session.userStateSummary)}`,
      `本轮用户输入：${input}`,
      `本轮分类器结果：${JSON.stringify(router)}`,
      `本轮 Agent 回复：${reply}`,
    ].join("\n\n");
    const out = await callLlm<SummaryOutput>({
      purpose: "summary",
      sessionId: session.id,
      turn: turnNo,
      system,
      user,
      json: true,
      small: true,
      mock: () => mockSummary(session, router),
    });
    // risk_flag 只升不降，摘要通道无权降级
    out.risk_flag = maxRisk(out.risk_flag, session.riskFlag);
    return out;
  } catch {
    // 裁量：摘要属于会话维护，失败时保留旧摘要并告警，
    // 不把已通过审查的回复替换成兜底（风险安全已由 1/3/4/5 步保证）
    logPipeline({
      sessionId: session.id,
      turn: turnNo,
      stage: "summary_write",
      detail: { warning: "summary failed, keep previous" },
    });
    return session.userStateSummary;
  }
}

// ---------------- 入口 ----------------

export async function handleChatTurn(params: {
  sessionId: string | null;
  input: string;
  cardAction: CardAction | null;
  branch: Branch | null;
}): Promise<ChatResponse> {
  let session = params.sessionId ? await getSession(params.sessionId) : undefined;
  if (!session) session = await createSession(params.branch);
  const turnNo = Math.floor(session.turns.length / 2) + 1;

  // 卡片交互：固定话术，两模式一致，不经 LLM
  if (params.cardAction) {
    if (params.cardAction.type === "mood") {
      session.mock.lastMood = params.cardAction.score;
    }
    let out = cardActionReply(params.cardAction, session);
    // 真实模式：需要动作卡时由 AI 生成（guard 拒绝或失败 → 静默降级静态库）
    if (
      !isMockMode() &&
      (params.cardAction.type === "battery" ||
        (params.cardAction.type === "shuffle" && out.cards[0]?.type === "action"))
    ) {
      const goal =
        params.cardAction.type === "battery" || session.stage === "action"
          ? ("move" as const)
          : ("sense" as const);
      const gen = await generateActionCard({
        sessionId: session.id,
        turn: turnNo,
        goal,
        battery: params.cardAction.type === "battery" ? params.cardAction.level : undefined,
        recentActions: session.recentActions,
        recentTurns: historyText(session),
        summary: JSON.stringify(session.userStateSummary),
      });
      if (gen) {
        out = { ...out, cards: [{ type: "action", list: [gen.card], index: 0 }] };
      }
    }
    trackActionTitle(session, out.cards);
    session.turns.push({ role: "user", content: describeCardAction(params.cardAction) });
    session.turns.push({ role: "assistant", content: out.reply });
    if (out.stage) session.stage = out.stage;
    session.mock.lastCard = out.cards[0] ?? null;
    await saveSession(session);
    logPipeline({
      sessionId: session.id,
      turn: turnNo,
      stage: "main",
      provider: "local",
      detail: { cardAction: params.cardAction.type },
    });
    return {
      sessionId: session.id,
      reply: out.reply,
      cards: out.cards,
      stage: session.stage,
      safeMode: false,
    };
  }

  const input = params.input.trim().slice(0, INPUT_MAX);

  // 1. 风险分类（双通道取高）
  const router = await runRouter(session, turnNo, input);

  // 2. 读取状态摘要
  logPipeline({
    sessionId: session.id,
    turn: turnNo,
    stage: "summary_read",
    detail: { risk_flag: session.riskFlag, stage: session.stage },
  });

  // 3. 阶段决策（≥ elevated → 安全替换；overload → 稳定化；resistance → 不推进）
  const decision = decideStage(session, router);
  logPipeline({
    sessionId: session.id,
    turn: turnNo,
    stage: "stage_decision",
    detail: {
      stage: decision.stage,
      safeMode: decision.safeMode,
      router_stage_signal: router.stage_signal,
      resistance: router.resistance,
      overload: router.overload,
      rule_risk: router.risk_level,
    },
  });

  // 4. 主生成（安全分支替换式）
  const main = await runMain(session, turnNo, input, decision);

  // 5. 输出审查（不通过 → 重写一次 → 仍不过 → 兜底）
  const reviewed = await runReview(session, turnNo, input, main, decision);

  // 6. 摘要更新
  const nextSummary = await runSummary(session, turnNo, input, router, reviewed.reply);

  // 7. 写回会话（风险只升不降 + 例外降级通道：明确否认且连续 3 轮无信号）
  session.turns.push({ role: "user", content: input });
  session.turns.push({ role: "assistant", content: reviewed.reply });
  session.stage = decision.stage;
  if (DENIAL_PATTERN.test(input)) session.denied = true;
  const aggregated = maxRisk(router.risk_level, session.riskFlag);
  session.riskFlag = aggregated;
  session.riskNote = router.risk_level === "none" ? "无" : router.risk_evidence;
  // streak 计数只看本轮判定结果：安全分支期间用户持续平静+否认也应累积，
  // 否则 elevated 永不降级（死锁）；crisis 明确不参与降级
  session.noRiskStreak = router.risk_level === "none" ? session.noRiskStreak + 1 : 0;
  if (
    session.denied &&
    session.noRiskStreak >= 3 &&
    aggregated !== "none" &&
    aggregated !== "crisis"
  ) {
    session.riskFlag = stepDownRisk(aggregated);
    session.noRiskStreak = 0;
    session.denied = false; // 降一次即重新累积观察
  }
  session.validationOnlyStreak = router.validation_only_streak;
  session.ruminationRounds = router.rumination_rounds;
  session.userStateSummary = nextSummary;
  session.mock.lastCard = reviewed.cards[0] ?? null;
  trackActionTitle(session, reviewed.cards);
  await saveSession(session);

  logPipeline({
    sessionId: session.id,
    turn: turnNo,
    stage: "summary_write",
    detail: {
      stage: session.stage,
      risk_flag: session.riskFlag,
      fallback: reviewed.fallback ?? false,
    },
  });

  return {
    sessionId: session.id,
    reply: reviewed.reply,
    cards: reviewed.cards,
    stage: session.stage,
    safeMode: decision.safeMode,
    fallback: reviewed.fallback,
  };
}
