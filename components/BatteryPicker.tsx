"use client";

import type { Battery } from "@/lib/types";

const options: { value: Battery; label: string; sub: string }[] = [
  { value: 1, label: "一格", sub: "只够躺着" },
  { value: 2, label: "两格", sub: "能挪一挪" },
  { value: 3, label: "三格", sub: "还能动动" },
];

function BatteryIcon({ level }: { level: Battery }) {
  return (
    <svg viewBox="0 0 26 16" className="h-5 w-8" aria-hidden="true">
      <rect
        x="1.5"
        y="2.5"
        width="20"
        height="11"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="23" y="5.5" width="2.5" height="5" rx="1.25" fill="currentColor" />
      {Array.from({ length: level }, (_, i) => (
        <rect key={i} x={4 + i * 5} y={5} width={3.5} height={6} rx={1} fill="currentColor" />
      ))}
    </svg>
  );
}

export default function BatteryPicker({
  onSelect,
}: {
  onSelect: (level: Battery) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onSelect(o.value)}
          className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-paper px-2 py-3.5 transition hover:border-sage/50 active:scale-[0.97]"
        >
          <BatteryIcon level={o.value} />
          <span className="text-[15px] font-medium">{o.label}</span>
          <span className="text-xs text-ink-soft">{o.sub}</span>
        </button>
      ))}
    </div>
  );
}
