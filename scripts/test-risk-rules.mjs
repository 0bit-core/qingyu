// riskRules 单元断言：node --experimental-strip-types scripts/test-risk-rules.mjs
import { ruleRisk, DENIAL_PATTERN, maxRisk } from "../lib/riskRules.ts";

const cases = [
  // ---- 强信号（brief §7.3 必收词） ----
  ["如果我不在了会不会有人注意到", "elevated"],
  ["想消失", "elevated"],
  ["再也撑不下去了", "elevated"],
  ["睡过去就别醒", "elevated"],
  ["东西都送人了", "crisis"],
  ["交代后事", "crisis"],
  ["我写了遗书", "crisis"],
  // ---- 方法性提问（只转介不展开） ----
  ["怎么才能没有痛苦地死", "crisis"],
  ["安眠药吃多少会死", "crisis"],
  ["割腕", "crisis"],
  // ---- 弱信号两级（确认过的方案①） ----
  ["活着真没意思", "elevated"], // 弱信号 + 存在语境
  ["我好累", "elevated"], // 弱信号 + 自指
  ["我撑不住了", "elevated"],
  ["这部电影真没意思", "low"], // 弱信号无语境 → 记 low，不触发安全分支
  ["上班没意思，摸鱼", "low"],
  ["健身完好累", "low"],
  // ---- 未成年人（只转介） ----
  ["我今年14岁，最近好累", "elevated"],
  ["我是初中生，坚持不下去了", "elevated"],
  // ---- 受害/解离/他伤 ----
  ["有人打我", "elevated"],
  ["耳边有声音让我去死", "elevated"],
  ["想杀了同事", "elevated"],
  // ---- 无风险输入（交给 LLM 通道） ----
  ["今天什么都不想干", null],
  ["哈哈哈哈今天天气不错", null],
  ["我丢了工作，很难过", null],
  // ---- 否认词表（降级通道用，不用于升级） ----
  ["我没有想不开，放心吧", null],
];

let failed = 0;
for (const [text, expected] of cases) {
  const hit = ruleRisk(text);
  const got = hit ? hit.level : null;
  const ok = got === expected;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  [${expected ?? "none"}] ${JSON.stringify(text)}  → ${got ?? "none"}${hit ? `  (${hit.note})` : ""}`,
  );
}

// 语义护栏
const guard = [
  ["maxRisk(none, crisis) === crisis", maxRisk("none", "crisis") === "crisis"],
  ["maxRisk(elevated, low) === elevated", maxRisk("elevated", "low") === "elevated"],
  ["否认句不升级", ruleRisk("我没有想不开，放心吧") === null],
  ["否认词表可匹配（供降级通道）", DENIAL_PATTERN.test("我没有想不开，放心吧")],
];
for (const [name, ok] of guard) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
