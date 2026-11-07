import Link from "next/link";
import type { ReactNode } from "react";
import type { Branch } from "@/lib/types";

const entries: { branch: Branch; title: string; sub: string; icon: ReactNode }[] = [
  {
    branch: "stabilize",
    title: "脑子有点吵",
    sub: "停不下来的时候，先让它安静一会儿",
    icon: <NoiseIcon />,
  },
  {
    branch: "action",
    title: "提不起劲",
    sub: "不用打起精神，一件小事就够了",
    icon: <BatteryLowIcon />,
  },
  {
    branch: "explore",
    title: "就是想说说话",
    sub: "随便聊，没什么目的",
    icon: <BubbleIcon />,
  },
];

export default function EntryCards() {
  return (
    <nav aria-label="今天想从哪个开始" className="flex flex-col gap-3">
      {entries.map((e) => (
        <Link
          key={e.branch}
          href={{ pathname: "/chat", query: { branch: e.branch } }}
          className="flex items-center gap-4 rounded-3xl border border-line bg-card p-5 transition hover:border-sage/40 active:scale-[0.98]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sage-soft text-sage-deep">
            {e.icon}
          </span>
          <span>
            <span className="block text-[17px] font-semibold">{e.title}</span>
            <span className="mt-0.5 block text-sm text-ink-soft">{e.sub}</span>
          </span>
        </Link>
      ))}

      <Link
        href="/quiet"
        className="mt-1 flex items-center justify-center gap-1.5 rounded-3xl border border-dashed border-line px-5 py-4 text-[15px] text-ink-soft transition hover:border-sage/40 hover:text-ink active:scale-[0.98]"
      >
        不知道，随便看看
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </nav>
  );
}

function NoiseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 8c2-2 4-2 6 0s4 2 6 0 4-2 4 0" />
      <path d="M4 13c2-2 4-2 6 0s4 2 6 0 4-2 4 0" />
      <path d="M4 18c2-2 4-2 6 0s4 2 6 0 4-2 4 0" />
    </svg>
  );
}

function BatteryLowIcon() {
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
        strokeWidth="1.7"
      />
      <rect x="23" y="5.5" width="2.5" height="5" rx="1.25" fill="currentColor" />
      <rect x="4.5" y="5.5" width="3.5" height="5" rx="1" fill="currentColor" />
    </svg>
  );
}

function BubbleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11.5c0 4-3.6 7-8 7-1 0-2-.15-2.9-.43L5 19.5l1-3.2C4.75 15 4 13.35 4 11.5c0-4 3.6-7 8-7s8 3 8 7Z" />
      <path d="M9 10.5h.01M12.5 10.5h.01M16 10.5h.01" strokeWidth="2.4" />
    </svg>
  );
}
