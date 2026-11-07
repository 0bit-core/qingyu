import type { RiskLevel } from "./types";

// 风险规则兜底（brief §7.1：小模型 + 规则双通道，结果取高；§7.3：间接表达不得漏判）。
// 原则：宁可误判，不可漏判。
//
// 两级结构（brief 确认时约定的方案①）：
// - 强信号（crisis / elevated）：无条件升级；
// - 弱信号（"没意思/累了"类日常表达）：仅在出现自指或存在/告别语境时升级，
//   否则记 low，交给 LLM 分类器通道结合上下文判断。
// - 未成年人 + 情绪信号 → 升级，只转介不展开（brief §7.7）。

type Pattern = { re: RegExp; note: string };

// ---------------- crisis：意图 / 计划 / 手段 / 告别 ----------------

const CRISIS_RULES: Pattern[] = [
  {
    note: "明确意图或计划",
    re: /(想|打算|准备|计划)(着?)?(去)?(死|自杀|结束(生命|自己|一切)?|离开这个世界|了断)/,
  },
  {
    note: "方法性提问（只转介不展开，brief §7.7）",
    re: /(怎么|如何|什么办法|哪种方式)(能|可以)?.{0,8}(死|自杀|结束|无痛)|无痛地?(死|离开)/,
  },
  {
    note: "药物与剂量线索",
    re: /(吃|吞|囤|攒|买).{0,10}(安眠药|药片|整瓶).{0,8}(死|睡过去|结束|走)|(安眠药|药片).{0,6}(多少|剂量)/,
  },
  {
    note: "自伤工具",
    re: /割腕|划手腕|刀片.{0,4}(划|割)|烧炭|上吊|跳楼|跳桥|吞药/,
  },
  {
    note: "告别 / 后事 / 分发物品",
    re: /交代后事|写了?遗书|遗书|东西(都|全)(送|分)(给|了|人)|把.{2,10}(送|留给)了?(朋友|家人|同学|大家)/,
  },
];

// ---------------- elevated：间接 / 委婉 / 假设式表达（无条件升级） ----------------

const ELEVATED_RULES: Pattern[] = [
  {
    note: "假设式/委婉表达",
    re: /如果我不在了|我不在(的话|了)|没有我.{0,8}(会|该|就)|我消失.{0,4}(好了|算了|吧)/,
  },
  {
    note: "想消失 / 别醒来",
    re: /想消失|消失掉(好了|算了)?|睡过去就别醒|一觉不醒|永远睡下去|再也不醒来/,
  },
  {
    note: "撑不下去（brief §7.3 必收）",
    re: /再?也?撑不下去|熬不下去|扛不过去|活不下去|不想活(了|着)?|活着(好累|真累|太累)/,
  },
  {
    note: "存在无意义感（直接指向生命）",
    re: /活着(有什么|有啥|没).{0,4}(意思|意义|盼头)|人间不值得|来这世上(干什么|做什么)/,
  },
  {
    note: "自我消失倾向",
    re: /从(这个)?世界上消失|变成灰|蒸发(了|掉)|不存在就好了?/,
  },
  {
    note: "正在受伤害",
    re: /被(打|骂|虐待|家暴|威胁|恐吓)|有人(打|欺负)我/,
  },
  {
    note: "无法保证当下安全 / 解离",
    re: /不知道自己在(哪|干什么)|灵魂出窍|耳边有(声音|人)让我(死|去死|伤害)/,
  },
  {
    note: "伤害他人",
    re: /想(杀|捅|伤害|打)了?(人|他|她|同学|家人|老师)?|报复(社会|他们)/,
  },
];

// ---------------- 弱信号：需自指 / 存在 / 告别语境（方案①） ----------------

const WEAK_RULES: Pattern[] = [
  { note: "弱信号：没意思/没意义", re: /没意思|没意义|无聊透了|没盼头/ },
  {
    note: "弱信号：累/撑着（撑不下去是强信号，见 elevated）",
    re: /好累|太累|累垮|坚持不下去了?|撑不住了?/,
  },
  { note: "弱信号：想哭/难受", re: /想哭|忍不住哭|难受(死了|极了)?|心里苦/ },
];

const CONTEXT_RULES: Pattern[] = [
  { note: "自指", re: /我|自己|本人/ },
  {
    note: "存在语境",
    re: /活着|每天|天天|这日子|这样的日子|人生|下半辈子|一直这样|再也不/,
  },
  { note: "告别语境", re: /最后.{0,6}(一次|一天)|再也不见|跟.{1,6}告别|对不起(大家|所有人)/ },
];

// ---------------- 其他信号 ----------------

/** 未成年线索（brief §7.7：涉及未成年人只转介不展开） */
const MINOR_PATTERN =
  /(\d{1,2})岁|十[一二三四五]?岁|[五六七八九]岁|初中|高一|高二|高三|初三|未成年/;

/** 明确否认（降级例外通道的必要条件之一，brief §7.2） */
export const DENIAL_PATTERN =
  /(没有?|才没有?|不想?|不会?)(想不开|自杀|伤害自己|那样(做|的事))|不会?(做傻事|想不开)|没事了|放心吧/;

export type RuleHit = {
  level: RiskLevel;
  evidence: string;
  note: string;
  /** true = 命中的是弱信号（语境条件升级） */
  weak: boolean;
};

export function ruleRisk(input: string): RuleHit | null {
  const text = input.trim();
  if (!text) return null;

  for (const rule of CRISIS_RULES) {
    const m = text.match(rule.re);
    if (m) return { level: "crisis", evidence: m[0], note: rule.note, weak: false };
  }
  for (const rule of ELEVATED_RULES) {
    const m = text.match(rule.re);
    if (m) return { level: "elevated", evidence: m[0], note: rule.note, weak: false };
  }

  const hasContext = CONTEXT_RULES.some((r) => r.re.test(text));
  const minor = MINOR_PATTERN.test(text);
  for (const rule of WEAK_RULES) {
    const m = text.match(rule.re);
    if (m) {
      if (hasContext || minor) {
        return {
          level: "elevated",
          evidence: m[0],
          note: minor ? "未成年人+情绪弱信号，只转介" : `${rule.note}，语境命中`,
          weak: true,
        };
      }
      return { level: "low", evidence: m[0], note: `${rule.note}，无语境记 low`, weak: true };
    }
  }
  return null;
}

export const RISK_ORDER: RiskLevel[] = ["none", "low", "elevated", "high", "crisis"];

export function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;
}

/** 风险降一级（只升不降的例外通道：明确否认且连续 3 轮无信号；crisis 不降） */
export function stepDownRisk(level: RiskLevel): RiskLevel {
  const idx = RISK_ORDER.indexOf(level);
  return RISK_ORDER[Math.max(0, idx - 1)];
}
