import { emergencyMessage } from "@/config/emergency";
import { localeResourcesText } from "@/config/resources";

// 人工审定的兜底回复（brief §7.5）。
// ⚠️ 本文件的文案是安全资产：不得由模型生成、不得在代码里改写；
//    任何 LLM 调用失败或审查连续不通过时原样返回，并附资源。

/** 一般兜底：LLM 失败但无风险信号时 */
export const generalFallback =
  "我这会儿有点接不上话。想接着说就再打一句，不想说就待一会儿，都行。";

/** 安全兜底：风险等级 ≥ elevated，或安全分支生成/审查失败时 */
export function safetyFallback(): string {
  return [
    "你刚才说的让我有点担心你。想先确认一件事：你现在是安全的吗？有没有想伤害自己的念头？",
    emergencyMessage,
    `也可以记下这些电话：${localeResourcesText()}。现在能不能找到一个你信得过的人，打个电话？`,
  ].join("\n");
}

/** 摘要通道失败时的占位（不影响本轮回复，仅写回会话） */
export function summaryFallback(previous: string): string {
  return previous;
}
