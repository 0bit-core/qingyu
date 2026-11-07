"use client";

import type { MicroAction } from "@/lib/types";

/**
 * 微行动卡片。一次只推一张；
 * 「换一张」「不想做」永远可用（brief §4），做完只收一个表情（M5 接入）。
 */
export default function ActionCard({
  action,
  onDone,
  onShuffle,
  onSkip,
}: {
  action: MicroAction;
  onDone?: () => void;
  onShuffle?: () => void;
  onSkip?: () => void;
}) {
  return (
    <div>
      <p className="text-xs text-ink-soft">一件小事，不用计时</p>
      <h3 className="mt-1.5 text-lg font-semibold">{action.title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{action.body}</p>
      <div className="mt-4 flex items-center gap-2">
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-full bg-sage px-4 py-2 text-sm text-white transition hover:bg-sage-deep active:scale-95"
          >
            做完了
          </button>
        )}
        {onShuffle && (
          <button
            type="button"
            onClick={onShuffle}
            className="rounded-full border border-line px-4 py-2 text-sm text-ink-soft transition hover:border-sage/50 hover:text-ink active:scale-95"
          >
            换一张
          </button>
        )}
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full px-3 py-2 text-sm text-ink-soft underline-offset-4 transition hover:text-ink hover:underline active:scale-95"
          >
            不想做
          </button>
        )}
      </div>
    </div>
  );
}
