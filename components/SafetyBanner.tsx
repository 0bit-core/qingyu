import Link from "next/link";
import { emergencyMessage } from "@/config/emergency";

/**
 * 安全分支提示条：safeMode 时出现在对话流中。
 * 文案以 config/emergency.ts 为单一来源（人工审定资产，不在组件里改写）。
 */
export default function SafetyBanner() {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-storm/25 bg-storm-soft px-4 py-3.5 text-sm leading-relaxed text-storm"
    >
      <p className="font-medium">现在，你的安全最重要。</p>
      <p className="mt-1">{emergencyMessage}</p>
      <Link
        href="/resources"
        className="mt-2 inline-block font-medium underline underline-offset-4"
      >
        查看更多支持资源
      </Link>
    </div>
  );
}
