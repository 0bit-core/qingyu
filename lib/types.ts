// 共享类型。

// ---------------- 前台形态 ----------------

/** 首页三入口对应的分支（前台只出现轻入口文案，不暴露术语） */
export type Branch = "explore" | "stabilize" | "action";

/** 情绪天气：闷 / 飘 / 沉 / 刺 / 空 */
export type WeatherId = "men" | "piao" | "chen" | "ci" | "kong";

export type Weather = {
  id: WeatherId;
  label: string;
  hint: string;
};

/** 电量：一格 / 两格 / 三格 */
export type Battery = 1 | 2 | 3;

/** 微行动卡片内容（一次只推一张） */
export type MicroAction = {
  id: string;
  title: string;
  body: string;
};

/** 资源地区（brief §7.6：中国大陆 / 港澳台 / 海外） */
export type RegionId = "cn" | "hmt" | "overseas";

export type RegionInfo = {
  id: RegionId;
  label: string;
};

export type ResourceEntry = {
  id: string;
  region: RegionId;
  name: string;
  phone: string;
  hours?: string;
  note?: string;
  /** false = 号码来自公开资料、尚未人工复核；上线要求全部 true */
  reviewed: boolean;
};

/** /quiet 页的一段话 */
export type QuietWords = {
  id: string;
  text: string;
};

// ---------------- 后台管线 ----------------

export type RiskLevel = "none" | "low" | "elevated" | "high" | "crisis";

/** 会话内阶段。safety 为替换式安全分支（brief §7.4）。 */
export type Stage =
  | "explore"
  | "stabilize"
  | "insight"
  | "action"
  | "close"
  | "off_topic"
  | "safety";

/** L2_router 分类器输出 */
export type RouterOutput = {
  risk_level: RiskLevel;
  risk_evidence: string;
  emotion_tags: string[];
  intensity: number;
  topic: string;
  stage_signal: Stage;
  resistance: boolean;
  overload: boolean;
  rumination_rounds: number;
  validation_only_streak: number;
};

/** L5_review 输出审查器输出 */
export type ReviewOutput = {
  pass: boolean;
  reason: string;
  rewrite_hint: string;
};

export type MoodTrend = "改善" | "持平" | "下降" | "波动";

/** L4_summary 状态摘要 */
export type SummaryOutput = {
  mood_trend: MoodTrend;
  current_intensity: number;
  recurring_themes: string[];
  what_helped: string[];
  risk_flag: RiskLevel;
  risk_note: string;
  stage: string;
  open_loop: string;
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** API → 前端的卡片（一次最多推一张） */
export type CardPayload =
  | { type: "weather" }
  | { type: "battery" }
  | { type: "emoji" }
  | { type: "action"; list: MicroAction[]; index: number };

/** 前端 → API 的卡片动作 */
export type CardAction =
  | { type: "weather_select"; value: WeatherId }
  | { type: "weather_skip" }
  | { type: "battery"; level: Battery }
  | { type: "shuffle" }
  | { type: "skip" }
  | { type: "done" }
  | { type: "mood"; score: 1 | 2 | 3 | 4 | 5 };

export type SessionState = {
  id: string;
  createdAt: number;
  updatedAt: number;
  /** 首页入口弱信号 */
  entryBranch: Branch | null;
  stage: Stage;
  turns: ChatTurn[];
  /** 会话级风险标记：只升不降（brief §7.2） */
  riskFlag: RiskLevel;
  riskNote: string;
  /** 连续无风险信号轮数（降级判断用） */
  noRiskStreak: number;
  /** 用户是否明确否认过风险（降级例外通道的必要条件之一） */
  denied: boolean;
  validationOnlyStreak: number;
  ruminationRounds: number;
  userStateSummary: SummaryOutput;
  /** mock/卡片交互状态 */
  mock: {
    freeReplyIdx: number;
    lastCard: CardPayload | null;
    /** 最近一次表情反馈（1–5；粗粒度，mock 摘要的 mood_trend 用） */
    lastMood: 1 | 2 | 3 | 4 | 5 | null;
  };
  /** 最近推过的动作卡标题（最多 5 条；AI 生成与 mock 挑选都用于去重） */
  recentActions: string[];
};

/** POST /api/chat 响应 */
export type ChatResponse = {
  sessionId: string;
  reply: string;
  cards: CardPayload[];
  stage: Stage;
  safeMode: boolean;
  /** true = 本轮走了人工审定兜底（仅调试观测，前台不展示） */
  fallback?: boolean;
};
