import Link from "next/link";
import { DogSit } from "@/components/mascots";

export default function NotFound() {
  return (
    <main className="mx-auto grid w-full max-w-md flex-1 place-items-center px-5 pb-16 md:max-w-2xl">
      <div className="text-center">
        <DogSit className="mx-auto h-24 w-auto" />
        <h1 className="mt-4 text-lg font-semibold">这里什么都没有。</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          它也在这儿等了一会儿了——页面可能被挪走了。
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
