import { ruleRisk } from "./riskRules";
import type {
  Battery,
  Branch,
  CardAction,
  CardPayload,
  MicroAction,
  RouterOutput,
  SessionState,
  Stage,
  SummaryOutput,
  WeatherId,
} from "./types";

// mock 模式的预设内容库（brief §2：未配置 API key 时所有 AI 功能返回本地模拟回复）。
// 其中「开场白 / 卡片交互回应」两套文案在真实模式下也原样使用：
// 它们是产品固定话术（人工审定性质），不经过生成模型，保证交互稳定。

// ---------------- 固定话术（两模式共用） ----------------

/** 开场白（branch 为空按 explore 处理）。开场是固定话术，不需要生成模型。 */
export function openingFor(branch: Branch | null): { reply: string; cards: CardPayload[] } {
  const key = branch ?? "explore";
  if (key === "stabilize") {
    return {
      reply: "吵，就先不让它想。来个 20 秒的小东西，不想做直接说。",
      cards: [{ type: "action", list: stabilizeActions, index: 0 }],
    };
  }
  if (key === "action") {
    return { reply: "那就只干一件小事，干完拉倒。", cards: [{ type: "battery" }] };
  }
  return { reply: "在呢。不用打招呼，想说什么都行。", cards: [{ type: "weather" }] };
}

// ---------------- 预设回复内容（mock 模式） ----------------

export const weatherReplies: Record<WeatherId, string> = {
  men: "闷着是挺难受的。是有件事堵着，还是说不清的那种闷？",
  piao: "飘着也好。最近是不是事儿太多，脑子顾不过来了？",
  chen: "沉的时候不用硬提。想说就说点，不想说就待一会儿。",
  ci: "先不碰它。愿意的话，说说今天哪一下扎得最深？",
  kong: "空着也行。先不找感觉，待着就好。",
};

export const weatherLabels: Record<WeatherId, string> = {
  men: "闷",
  piao: "飘",
  chen: "沉",
  ci: "刺",
  kong: "空",
};

export const stabilizeActions: MicroAction[] = [
  { id: "s1", title: "找三样蓝色的东西", body: "环顾四周，慢慢找。找到三样就算完。" },
  { id: "s2", title: "听一下最远的声音", body: "不用闭眼。找到周围最远的那一个，听几秒。" },
  { id: "s3", title: "肩膀耸起来，再掉下来", body: "耸到耳朵，停两秒，让它们自己掉下来。做两次。" },
  { id: "s4", title: "吹灭一根很远的蜡烛", body: "用鼻子吸气，用嘴慢慢地、长长地吹。吹两次。" },
];

export const batteryActions: Record<Battery, MicroAction[]> = {
  1: [
    { id: "a1-1", title: "把窗帘拉开一条缝", body: "让光进来一点就行，不用全拉开。" },
    { id: "a1-2", title: "喝口水，注意一下温度", body: "凉的还是温的，就留意这一下。" },
    { id: "a1-3", title: "给朋友发个表情", body: "说什么不重要，发出去就行。" },
  ],
  2: [
    { id: "a2-1", title: "到窗边站两分钟", body: "看一件你平时没注意过的东西，什么都行。" },
    { id: "a2-2", title: "把桌上的东西归到一边", body: "只归一小块，别的不用管。" },
    { id: "a2-3", title: "顺手洗一个杯子", body: "就一个，洗完就算。" },
  ],
  3: [
    { id: "a3-1", title: "出门走五分钟", body: "只留意你看到的第一样东西。走完就回来。" },
    { id: "a3-2", title: "把垃圾带下楼", body: "顺路就行，不用走远。" },
    { id: "a3-3", title: "给窗台浇浇水", body: "没有花？那就擦一擦窗台的一小块。" },
  ],
};

export const batteryLeads: Record<Battery, string> = {
  1: "那就找一件几乎不用力气的。",
  2: "找个不费劲、但能换换空气的。",
  3: "那来个五分钟级别的。",
};

export const batteryLabels: Record<Battery, string> = {
  1: "还剩一格",
  2: "还剩两格",
  3: "还剩三格",
};

export const weatherSkipReply = "行，那不挑。想打字就打点，不想说就待着。";
export const shuffleReply = "换一张。这个不行就再换。";
export const noCardShuffleReply = "手头就这几张了。要不直接说说，我听着。";
export const skipReply = "行，那就先不做。它又跑不了，随时都在。";
export const actionDoneReply = "做完就算完成，不用评价它。";
export const stabilizeDoneReply = "好了，就到这里。想接着说说，或者就这么待着，都行。";
export const resistanceReply = "行，那就不说。想待着就待着。";
export const moodAckReply = "收到。";

export const freeReplies = [
  "嗯，我在。后来呢？",
  "收到。慢慢说，不着急。",
  "这话说出来不容易。愿意多讲一点就讲，不讲也行。",
  "先不解决什么。你是想说说，还是想有人陪着待一会儿？",
];

// ---------------- mock 分类器（L2 的本地替身） ----------------

export function mockRouter(input: string, session: SessionState): RouterOutput {
  const text = input.trim();
  const resistance = /不想说|别问了|不想聊|不想继续|停一停|算了.{0,4}不想/.test(text);
  const overload = /脑子空白|崩了|受不了了|喘不过气|整个人都麻了/.test(text);

  let stage_signal: Stage = session.stage === "safety" ? "safety" : session.stage;
  if (overload) {
    stage_signal = "stabilize";
  } else if (resistance) {
    // 抗拒时不推进阶段（brief L2 规则 3）
    stage_signal = session.stage === "safety" ? "safety" : "explore";
  } else if (/吵|停不下来|静不下来|心慌|睡不着|脑子里一直/.test(text)) {
    stage_signal = "stabilize";
  } else if (/提不起劲|什么都不想干|不想干|没力气|干不动|累瘫/.test(text)) {
    stage_signal = "action";
  } else if (
    /没用|废物|失败者?|没出息|丢人|都怪我|我不行|我做不到|毫无价值/.test(text)
  ) {
    // 反复自我批评 → L3_insight 的「换个说法」路线
    stage_signal = "insight";
  } else if (/先这样(吧)?|就到(这儿|这里)|拜拜|我(走|下线)了|想睡了/.test(text)) {
    stage_signal = "close";
  } else if (session.stage === "stabilize" && text.length > 12) {
    // 稳定化后回应变长 → 回探索
    stage_signal = "explore";
  }

  return {
    risk_level: "none", // mock 分类器不做风险语义；风险由 riskRules 通道兜底，取高
    risk_evidence: "无",
    emotion_tags: [],
    intensity: 0,
    topic: "无明确主题",
    stage_signal,
    resistance,
    overload,
    rumination_rounds: 0,
    validation_only_streak: 0,
  };
}

// ---------------- mock 主生成（L3 的本地替身，仅纯文本输入走这里） ----------------

export function mockMainReply(opts: {
  session: SessionState;
  stage: Stage;
  input: string;
  resistance?: boolean;
}): { reply: string; cards: CardPayload[] } {
  const { session, stage, input } = opts;

  // 抗拒：停止追问，不推进流程（brief L1/L2）
  if (opts.resistance) {
    return { reply: resistanceReply, cards: [] };
  }

  switch (stage) {
    case "stabilize": {
      const index = session.mock.lastCard?.type === "action" ? session.mock.lastCard.index : 0;
      return {
        reply: "先做个 20 秒的小东西，不着急。",
        cards: [{ type: "action", list: stabilizeActions, index }],
      };
    }
    case "action":
      return { reply: "那就选个当下电量干得动的小事。", cards: [{ type: "battery" }] };
    case "insight":
      return { reply: "这句话现在音量很大。它是从哪儿冒出来的？", cards: [] };
    case "close":
      return { reply: "今天到这儿就挺好，随时可以回来。", cards: [] };
    default: {
      // explore：接话 + 轮换
      const reply = freeReplies[session.mock.freeReplyIdx % freeReplies.length];
      session.mock.freeReplyIdx += 1;
      return { reply, cards: [] };
    }
  }
}

// ---------------- mock 审查 / 摘要 ----------------

/** mock 审查恒通过（超时降级路径只在真实模式触发，mock 演示不模拟失败） */
export function mockReview() {
  return { pass: true, reason: "无", rewrite_hint: "无" };
}

export function mockSummary(
  session: SessionState,
  router: RouterOutput,
): SummaryOutput {
  const prev = session.userStateSummary;
  const themes = [...prev.recurring_themes];
  if (router.topic !== "无明确主题" && !themes.includes(router.topic)) {
    themes.unshift(router.topic);
  }
  // 表情反馈粗粒度映射（1–5 → 改善/下降/持平），只影响摘要趋势
  const mood = session.mock.lastMood;
  return {
    mood_trend: mood ? (mood >= 4 ? "改善" : mood <= 2 ? "下降" : "持平") : prev.mood_trend,
    current_intensity: router.intensity,
    recurring_themes: themes.slice(0, 3),
    what_helped: prev.what_helped,
    risk_flag: router.risk_level,
    risk_note: router.risk_level === "none" ? "无" : router.risk_evidence,
    stage: session.stage,
    open_loop: prev.open_loop,
  };
}

// ---------------- 卡片交互的固定回应（两模式共用，不经 LLM） ----------------

export function cardActionReply(
  action: CardAction,
  session: SessionState,
): { reply: string; cards: CardPayload[]; stage: Stage | null } {
  const last = session.mock.lastCard;
  switch (action.type) {
    case "weather_select":
      return { reply: weatherReplies[action.value], cards: [], stage: "explore" };
    case "weather_skip":
      return { reply: weatherSkipReply, cards: [], stage: null };
    case "battery":
      return {
        reply: batteryLeads[action.level],
        cards: [{ type: "action", list: batteryActions[action.level], index: 0 }],
        stage: "action",
      };
    case "shuffle":
      if (last?.type === "action") {
        const index = (last.index + 1) % last.list.length;
        return { reply: shuffleReply, cards: [{ type: "action", list: last.list, index }], stage: null };
      }
      return { reply: noCardShuffleReply, cards: [], stage: null };
    case "skip":
      return { reply: skipReply, cards: [], stage: null };
    case "done":
      // 行动分支做完 → 附表情卡（只收一个表情，brief §4）；
      // 稳定化做完 → 不收反馈（L3_stabilize：做完只说「就到这里」）
      return session.stage === "stabilize"
        ? { reply: stabilizeDoneReply, cards: [], stage: null }
        : { reply: actionDoneReply, cards: [{ type: "emoji" }], stage: null };
    case "mood":
      return { reply: moodAckReply, cards: [], stage: null };
  }
}

/** 供真实模式提示词描述卡片动作（L2/主生成的 user 消息里） */
export function describeCardAction(action: CardAction): string {
  switch (action.type) {
    case "weather_select":
      return `用户选了情绪天气「${weatherLabels[action.value]}」`;
    case "weather_skip":
      return "用户跳过了情绪天气卡片";
    case "battery":
      return `用户选了电量：${action.level} 格`;
    case "shuffle":
      return "用户点了「换一张」";
    case "skip":
      return "用户点了「不想做」";
    case "done":
      return "用户做完了那个小动作";
    case "mood":
      return `用户做完小动作后选了表情反馈（${action.score}/5）`;
  }
}

// re-export：pipeline 做双通道取高时用
export { ruleRisk };
