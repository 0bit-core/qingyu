import type { Metadata } from "next";
import Link from "next/link";
import CardShell from "@/components/CardShell";
import { overseasFallback, regions, resources } from "@/config/resources";

export const metadata: Metadata = {
  title: "资源",
};

// 地区筛选来自 URL 查询参数，允许该路由阻塞式动态渲染
export const instant = false;

export default async function ResourcesPage({
  searchParams,
}: PageProps<"/resources">) {
  const { region } = await searchParams;
  const active = regions.find((r) => r.id === region)?.id ?? "cn";
  const list = resources.filter((r) => r.region === active);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 pb-12 md:max-w-2xl">
      <header className="pt-6 md:pt-8">
        <Link href="/" className="text-base font-semibold tracking-tight">
          轻屿
        </Link>
        <h1 className="mt-6 text-xl font-semibold md:text-2xl">
          需要再多一点支持的时候
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          都记在这儿了，需要时再看，不看也没关系。
        </p>
      </header>

      <nav aria-label="选择地区" className="mt-5 flex flex-wrap gap-2">
        {regions.map((r) => (
          <Link
            key={r.id}
            href={{ pathname: "/resources", query: { region: r.id } }}
            aria-current={active === r.id ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              active === r.id
                ? "border-sage bg-sage text-white"
                : "border-line bg-card text-ink-soft hover:border-sage/50 hover:text-ink"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </nav>

      <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {active === "overseas" && (
          <li className="md:col-span-2">
            <CardShell>
              <h2 className="text-[15px] font-medium text-ink-soft">
                {overseasFallback.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed">
                {overseasFallback.text}
              </p>
            </CardShell>
          </li>
        )}

        {list.length === 0 && (
          <li className="md:col-span-2">
            <CardShell>
              <p className="text-[15px] leading-relaxed">
                这个地区的资源还在整理中。紧急情况请直接拨打当地急救电话。
              </p>
            </CardShell>
          </li>
        )}

        {list.map((entry) => (
          <li key={entry.id}>
            <CardShell>
              <h2 className="text-[15px] font-medium text-ink-soft">
                {entry.name}
              </h2>
              <a
                href={`tel:${entry.phone.replace(/\s/g, "")}`}
                className="mt-1 block text-[26px] font-semibold tracking-wide text-sage-deep"
              >
                {entry.phone}
              </a>
              <p className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-ink-soft">
                {entry.hours && <span>{entry.hours}</span>}
                {entry.note && <span>{entry.note}</span>}
              </p>
            </CardShell>
          </li>
        ))}

      </ul>

      <p className="mt-6 text-xs leading-relaxed text-ink-soft">
        号码来自公开资料，还在人工复核中，可能会有变动；拨打前请以官方页面为准。紧急情况请直接拨打当地急救电话。
      </p>
    </main>
  );
}
