"use client";

/**
 * 表情反馈（brief §4：行动完成后只收一个表情，不要求写感受、不记录时长）。
 * 5 个表情，后台映射粗粒度分值 1–5；引导语不做「感觉怎么样」式追问，
 * 「不选也行」由滑走兑现（滑走不发送任何内容）。
 */
const emojis = [
  { score: 1, icon: "😞", label: "很差" },
  { score: 2, icon: "🙁", label: "不太好" },
  { score: 3, icon: "😐", label: "一般" },
  { score: 4, icon: "🙂", label: "还好" },
  { score: 5, icon: "😄", label: "很好" },
] as const;

export default function EmojiFeedback({
  onPick,
}: {
  onPick: (score: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <div>
      <p className="text-sm text-ink-soft">选个表情就行，不选也行。</p>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {emojis.map((e) => (
          <button
            key={e.score}
            type="button"
            onClick={() => onPick(e.score)}
            aria-label={e.label}
            title={e.label}
            className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-paper px-1 py-2.5 transition hover:border-sage/50 active:scale-95"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              {e.icon}
            </span>
            <span className="text-[11px] text-ink-soft">{e.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
