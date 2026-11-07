import Link from "next/link";
import EntryCards from "@/components/EntryCards";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8">
      <header className="pb-8 pt-12">
        <svg viewBox="0 0 64 40" className="h-10 w-auto" aria-hidden="true">
          <circle cx="48" cy="10" r="7" fill="#e9b44c" />
          <path d="M6 32Q32 4 58 32Z" fill="#4f7a6b" opacity="0.9" />
          <path
            d="M2 37c5-2.5 10-2.5 15 0s10 2.5 15 0 10-2.5 15 0 10 2.5 15 0"
            fill="none"
            stroke="#4f7a6b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight">轻屿</h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
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
