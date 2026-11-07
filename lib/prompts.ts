import { readFile } from "fs/promises";
import path from "path";

// 提示词读取与组装。prompts/ 目录下的文件是代码资产，运行时原样读取，
// 不在代码里改写或精简（brief §6）。占位符在运行时注入：
// {locale_resources} / {emergency_message} / {user_state_summary} / {k}

export type PromptName =
  | "L0_safety"
  | "L1_style"
  | "L2_router"
  | "L3_explore"
  | "L3_stabilize"
  | "L3_insight"
  | "L3_action"
  | "L3_close"
  | "L3_safety"
  | "L4_summary"
  | "L5_review"
  | "L6_card";

const cache = new Map<string, string>();

export async function loadPrompt(name: PromptName): Promise<string> {
  // dev 下不缓存：改 prompts/ 立即生效；prod 缓存避免重复读盘
  if (process.env.NODE_ENV === "production") {
    const hit = cache.get(name);
    if (hit) return hit;
  }
  const file = path.join(process.cwd(), "prompts", `${name}.md`);
  const text = await readFile(file, "utf8");
  if (process.env.NODE_ENV === "production") cache.set(name, text);
  return text;
}

/** 占位符注入：只替换已知变量，其余 {..} 原样保留 */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? vars[key] : whole,
  );
}

/** 阶段提示词名（safety 是替换式分支，不是追加） */
export function stagePromptName(stage: string): PromptName {
  if (stage === "safety") return "L3_safety";
  if (stage === "off_topic") return "L3_explore";
  if (!stage.startsWith("L3_") && ["explore", "stabilize", "insight", "action", "close"].includes(stage)) {
    return `L3_${stage}` as PromptName;
  }
  return "L3_explore";
}
