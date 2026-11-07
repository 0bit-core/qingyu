import { logPipeline, type LlmPurpose } from "./logger";

// LLM 调用封装（brief §2 / §5）。
// - 未配置 API key → mock 模式：所有 AI 功能返回调用方给定的本地预设输出，
//   保证界面可完整演示，且链路与日志形态和真实模式完全一致。
// - 真实模式走 OpenAI 兼容 /chat/completions（LLM_BASE_URL），供应商差异
//   只体现在 base_url + model 组合上。
// - 调用失败 / 超时 → throw，由 pipeline 降级为人工审定兜底，不报错给用户。

const MAIN_TIMEOUT_MS = 45_000;
const SMALL_TIMEOUT_MS = 20_000;

export class LlmError extends Error {}

export function isMockMode(): boolean {
  return !(
    process.env.LLM_API_KEY &&
    process.env.LLM_BASE_URL &&
    process.env.LLM_MODEL_MAIN
  );
}

export function providerLabel(): string {
  return isMockMode() ? "mock" : process.env.LLM_PROVIDER || "openai-compatible";
}

function modelFor(small: boolean): string {
  if (small) return process.env.LLM_MODEL_SMALL || process.env.LLM_MODEL_MAIN || "";
  return process.env.LLM_MODEL_MAIN || "";
}

/** 容忍模型把 JSON 包在 ```json 围栏里 */
function extractJson(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new LlmError("invalid JSON output");
  }
}

export async function callLlm<T>(opts: {
  purpose: LlmPurpose;
  sessionId: string;
  turn: number;
  system: string;
  user: string;
  /** true = 要求 JSON 输出并做解析 */
  json: boolean;
  /** true = 小模型（风险分类 / 审查 / 摘要） */
  small: boolean;
  /** mock 模式下的预设输出（各调用方提供，保持链路可演示） */
  mock: () => T;
}): Promise<T> {
  const startedAt = Date.now();
  const base = {
    sessionId: opts.sessionId,
    turn: opts.turn,
    stage: opts.purpose,
  };

  if (isMockMode()) {
    const result = opts.mock();
    logPipeline({
      ...base,
      provider: "mock",
      ms: Date.now() - startedAt,
      detail: { json: opts.json, small: opts.small },
    });
    return result;
  }

  const model = modelFor(opts.small);
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.small ? SMALL_TIMEOUT_MS : MAIN_TIMEOUT_MS,
  );
  try {
    const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: opts.small ? 0.2 : 0.7,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new LlmError(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new LlmError("empty completion");
    logPipeline({
      ...base,
      provider: providerLabel(),
      model,
      ms: Date.now() - startedAt,
      detail: { json: opts.json },
    });
    return (opts.json ? (extractJson(text) as T) : (text as unknown as T));
  } catch (err) {
    logPipeline({
      ...base,
      provider: providerLabel(),
      model,
      ms: Date.now() - startedAt,
      detail: { error: err instanceof Error ? err.message : String(err) },
    });
    throw err instanceof LlmError ? err : new LlmError(String(err));
  } finally {
    clearTimeout(timer);
  }
}
