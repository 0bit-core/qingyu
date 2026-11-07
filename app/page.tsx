import Link from "next/link";
import EntryCards from "@/components/EntryCards";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 md:max-w-2xl">
      <header className="pb-8 pt-12 md:pt-16">
        <svg viewBox="0 0 64 40" className="h-10 w-auto md:h-12" aria-hidden="true">
          <circle cx="14" cy="8" r="5" fill="#e9b44c" />
          <path d="M6 32Q32 4 58 32Z" fill="#4f7a6b" opacity="0.9" />
          {/* 岛上的猫 */}
          <path d="M36 19 Q36 11 46 11 Q56 11 56 19 Z" fill="#3f6558" />
          <circle cx="41" cy="12" r="5" fill="#3f6558" />
          <path d="M38 8 L37 3 L42 6.5 Z" fill="#3f6558" />
          <path d="M45 8 L46 3 L40.5 6.5 Z" fill="#3f6558" />
          <path
            d="M55 17 Q61 15 59 9"
            stroke="#3f6558"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M2 37c5-2.5 10-2.5 15 0s10 2.5 15 0 10-2.5 15 0 10 2.5 15 0"
            fill="none"
            stroke="#4f7a6b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight md:text-3xl">
          轻屿
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft md:text-base">
          一个小角落。不用打卡，不用评分，也不用急着变好。
        </p>
      </header>

      <EntryCards />

      <footer className="mt-auto pb-2 pt-12 text-center text-[13px] leading-relaxed text-ink-soft">
        不用注册，不留记录，随时可以离开。
        <br />
        <Link
          href="/about"
          className="underline underline-offset-4 transition hover:text-ink"
        >
          这是什么？
        </Link>
      </footer>
    </main>
  );
}
