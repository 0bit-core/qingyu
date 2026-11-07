"use client";

import { useState } from "react";

/**
 * 清除本次会话（brief §7.8）。
 * 调 DELETE /api/session：清服务端内存记录 + 清 httpOnly cookie。
 * 无确认弹窗、无挽留话术——清除是无害操作。
 */
export default function ClearSessionButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const clear = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/session", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className="mt-3 text-sm text-sage-deep" role="status">
        已清除。之后新开的对话都是全新的。
      </p>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        type="button"
        onClick={clear}
        disabled={state === "loading"}
        className="rounded-full border border-line px-4 py-1.5 text-sm text-ink-soft transition hover:border-sage/50 hover:text-ink active:scale-95 disabled:opacity-50"
      >
        {state === "loading" ? "清除中…" : "清除本次会话"}
      </button>
      {state === "error" && (
        <span className="text-sm text-storm" role="alert">
          没清干净，再点一次试试。
        </span>
      )}
    </div>
  );
}
