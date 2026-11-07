// styleGuard 断言：node --experimental-strip-types scripts/test-style-guard.mjs
import { styleGuard } from "../lib/styleGuard.ts";

const banned = [
  "你这是典型的抑郁症表现，建议就医。", // 诊断
  "可以吃点药调整一下。", // 药物
  "我们来做几个疗程的认知行为疗法。", // 疗法
  "想开点，明天会更好。", // 否定感受
  "我会一直陪着你，这是我们之间的秘密。", // 依赖诱导/保密
  "我来评估一下你的情绪状态。", // 评估式
  "你可以在下方选择卡片。", // 产品说明
  "1. 先深呼吸 2. 再散步 3. 最后找人聊", // 清单
  "嗯。嗯。嗯。嗯。嗯。嗯。", // 过长（6 句）
];

const ok = [
  "那点事最磨人的是它天天都在。今天哪一段最难熬？不想细说也行。",
  "先做个 20 秒的小东西，不着急。",
  "夜里醒着的时候，时间过得特别慢。这几天都没睡好？",
  "行，那就不说。想待着就待着。",
  "先顾身体。想说说哪儿不舒服吗？说完记得喝口水。",
];

let failed = 0;
for (const text of banned) {
  const v = styleGuard(text);
  const good = !v.pass;
  if (!good) failed++;
  console.log(`${good ? "PASS" : "FAIL"} [拦截] ${v.reason.padEnd(8)} ← ${text.slice(0, 24)}`);
}
for (const text of ok) {
  const v = styleGuard(text);
  if (v.pass) {
    console.log(`PASS  [放行] ← ${text.slice(0, 24)}`);
  } else {
    failed++;
    console.log(`FAIL  [误拦:${v.reason}] ← ${text.slice(0, 24)}`);
  }
}
console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
