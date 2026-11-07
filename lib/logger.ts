// 管线日志：每段调用一行 JSON，grep「[qingyu]」即可逐段观测
// 四类 LLM 调用分别标记为 risk / main / review / summary（brief §8 验收项）。

export type LlmPurpose = "risk" | "main" | "rewrite" | "review" | "card" | "summary";

export type PipelineStage =
  | LlmPurpose
  | "session_created"
  | "summary_read"
  | "stage_decision"
  | "rewrite"
  | "summary_write"
  | "fallback";

export function logPipeline(fields: {
  sessionId: string;
  turn: number;
  stage: PipelineStage;
  provider?: string;
  model?: string;
  ms?: number;
  detail?: Record<string, unknown>;
}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    stage: fields.stage,
    session: fields.sessionId.slice(0, 8),
    turn: fields.turn,
    ...(fields.provider ? { provider: fields.provider } : {}),
    ...(fields.model ? { model: fields.model } : {}),
    ...(fields.ms !== undefined ? { ms: fields.ms } : {}),
    ...(fields.detail ? { detail: fields.detail } : {}),
  });
  console.log(`[qingyu] ${line}`);
}
