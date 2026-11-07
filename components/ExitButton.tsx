"use client";

import { useRouter } from "next/navigation";

/**
 * 全局退出键（brief §3：每个交互都有退出键，退出不触发挽留话术）。
 * 只做一件事：回首页。不弹确认框，不问原因。
 */
export default function ExitButton({ label = "先到这儿" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm text-ink-soft transition hover:text-ink active:scale-95"
    >
      {label}
    </button>
  );
}
