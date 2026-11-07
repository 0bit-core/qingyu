"use client";

import type { Weather, WeatherId } from "@/lib/types";

export const weathers: Weather[] = [
  { id: "men", label: "闷", hint: "像捂了层湿毛巾" },
  { id: "piao", label: "飘", hint: "魂不在身上" },
  { id: "chen", label: "沉", hint: "坠着，提不起来" },
  { id: "ci", label: "刺", hint: "一碰就疼" },
  { id: "kong", label: "空", hint: "空落落的，没什么感觉" },
];

function WeatherIcon({ id }: { id: WeatherId }) {
  const props = {
    viewBox: "0 0 24 24",
    className: "h-6 w-6",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (id) {
    case "men": // 三道雾
      return (
        <svg {...props}>
          <path d="M4 9h10M6 13h12M4 17h8" />
        </svg>
      );
    case "piao": // 风筝
      return (
        <svg {...props}>
          <path d="M12 3l5 6-5 6-5-6z" />
          <path d="M12 15v3m0 0c-1.5 0-2.5 1-2.5 2.5" />
        </svg>
      );
    case "chen": // 正在下坠的圆
      return (
        <svg {...props}>
          <circle cx="12" cy="14.5" r="4.5" />
          <path d="M12 3.5v4m0 0 2-2m-2 2-2-2" />
        </svg>
      );
    case "ci": // 刺
      return (
        <svg {...props}>
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l4 4M14 14l4 4M18 6l-4 4M10 14l-4 4" />
        </svg>
      );
    case "kong": // 虚线圆
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="7.5" strokeDasharray="3 3.5" />
        </svg>
      );
  }
}

export default function WeatherCards({
  selected,
  onSelect,
  onSkip,
}: {
  selected?: WeatherId;
  onSelect: (id: WeatherId, label: string) => void;
  onSkip?: () => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2.5">
      {weathers.map((w) => {
        const active = selected === w.id;
        return (
          <button
            key={w.id}
            type="button"
            onClick={() => onSelect(w.id, w.label)}
            aria-pressed={active}
            className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-3.5 transition active:scale-[0.97] ${
              active
                ? "border-sage bg-sage-soft text-sage-deep"
                : "border-line bg-paper text-ink hover:border-sage/50"
            }`}
          >
            <WeatherIcon id={w.id} />
            <span className="text-base font-medium">{w.label}</span>
            <span className="text-xs leading-snug text-ink-soft">{w.hint}</span>
          </button>
        );
      })}
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="rounded-2xl border border-dashed border-line px-3 py-3.5 text-sm text-ink-soft transition hover:border-sage/50 active:scale-[0.97]"
        >
          说不准，跳过
        </button>
      )}
    </div>
  );
}
