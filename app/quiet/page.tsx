"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CardShell from "@/components/CardShell";
import { breathCaption, breathDone, quietWords } from "@/config/quiet";

export default function QuietPage() {
  const [idx, setIdx] = useState(0);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);

  // 20 秒后自动停，不做计时器 UI，不催
  useEffect(() => {
    setDone(false);
    const t = setTimeout(() => setDone(true), 20000);
    return () => clearTimeout(t);
  }, [round]);

  const words = quietWords[idx];

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 pb-10 md:max-w-2xl">
      <header className="pt-6 md:pt-8">
        <Link href="/" className="text-base font-semibold tracking-tight">
          轻屿
        </Link>
      </header>

      <h1 className="sr-only">静一静</h1>

      <CardShell className="mt-6">
        <p key={words.id} className="fade-in text-[17px] leading-loose md:text-lg">
          {words.text}
        </p>
        <button
          type="button"
          onClick={() => setIdx((i) => (i + 1) % quietWords.length)}
          className="mt-4 text-sm text-ink-soft underline-offset-4 transition hover:text-ink hover:underline"
        >
          换一段
        </button>
      </CardShell>

      <div className="my-9 flex justify-center" aria-hidden="true">
        <svg viewBox="0 0 220 90" className="w-56 md:w-72">
          <circle cx="176" cy="22" r="13" fill="#e9b44c" opacity="0.85" />
          <path d="M20 68Q110 12 200 68Z" fill="#4f7a6b" opacity="0.9" />
          {/* 岛上的猫 */}
          <path d="M58 45 Q58 30 76 30 Q94 30 94 45 Z" fill="#3f6558" />
          <circle cx="65" cy="29" r="9" fill="#3f6558" />
          <path d="M58 22 L56 12 L67 18 Z" fill="#3f6558" />
          <path d="M72 22 L74 12 L63 18 Z" fill="#3f6558" />
          <circle cx="61" cy="30" r="1.5" fill="#f6f5f0" />
          <circle cx="69" cy="30" r="1.5" fill="#f6f5f0" />
          <path
            d="M93 42 Q106 38 102 26"
            stroke="#3f6558"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M4 78c9-4.5 18-4.5 27 0s18 4.5 27 0 18-4.5 27 0 18 4.5 27 0 18-4.5 27 0 18 4.5 27 0 18-4.5 27 0"
            fill="none"
            stroke="#4f7a6b"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <CardShell>
        <p className="text-sm leading-relaxed text-ink-soft">{breathCaption}</p>
        <div className="grid place-items-center py-9">
          <div className="animate-breathe h-24 w-24 rounded-full border-2 border-sage/70 bg-sage-soft md:h-28 md:w-28" />
        </div>
        {done && (
          <div className="fade-in text-center">
            <p className="text-[15px]">{breathDone}</p>
            <button
              type="button"
              onClick={() => setRound((r) => r + 1)}
              className="mt-3 rounded-full border border-line px-4 py-2 text-sm text-ink-soft transition hover:border-sage/50 hover:text-ink"
            >
              再来一轮
            </button>
          </div>
        )}
      </CardShell>

      <p className="mt-9 text-center text-[13px] text-ink-soft">
        想说话了？
        <Link
          href={{ pathname: "/chat", query: { branch: "explore" } }}
          className="underline underline-offset-4 transition hover:text-ink"
        >
          过去坐坐
        </Link>
      </p>
    </main>
  );
}
