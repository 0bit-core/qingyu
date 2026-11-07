import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid w-full max-w-md flex-1 place-items-center px-5 pb-16">
      <div className="text-center">
        <svg viewBox="0 0 64 40" className="mx-auto h-10 w-auto" aria-hidden="true">
          <circle cx="32" cy="8" r="6" fill="#e9b44c" />
          <path d="M8 30Q32 10 56 30Z" fill="#4f7a6b" opacity="0.5" />
          <path
            d="M4 35c5-2.5 10-2.5 15 0s10 2.5 15 0 10-2.5 15 0 10 2.5 15 0"
            fill="none"
            stroke="#4f7a6b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <h1 className="mt-4 text-lg font-semibold">这里什么都没有。</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          页面可能被挪走了，或者从来就没存在过。
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-sage px-5 py-2.5 text-sm text-white transition hover:bg-sage-deep active:scale-95"
        >
          回首页
        </Link>
      </div>
    </main>
  );
}
