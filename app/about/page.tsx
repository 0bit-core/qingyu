import type { Metadata } from "next";
import Link from "next/link";
import CardShell from "@/components/CardShell";
import ClearSessionButton from "@/components/ClearSessionButton";

export const metadata: Metadata = {
  title: "关于",
};

const notList = [
  "不是心理治疗，也不提供咨询服务",
  "不做诊断，不给你贴标签",
  "不涉及药物，不给任何治疗建议",
  "不能替代专业帮助",
  "没有排行榜、打卡和成就，也不会催你回来",
];

const privacyList = [
  "不用注册，不用实名",
  "你说的内容只临时放在服务器内存里，大约 2 小时后自动清除，重启就没了，不会写进数据库",
  "点「先到这儿」或直接关掉页面，就结束了",
  "没有广告，没有第三方统计",
];
export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 pb-12">
      <header className="pt-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          轻屿
        </Link>
        <h1 className="mt-6 text-xl font-semibold">关于轻屿</h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">把话说在前面。</p>
      </header>

      <div className="mt-5 flex flex-col gap-3.5">
        <CardShell>
          <h2 className="font-semibold">这是什么</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            心里发紧、提不起劲的时候，可以随手打开的小角落。可以随便说几句，也可以什么都不说，看看就关掉。
          </p>
        </CardShell>

        <CardShell>
          <h2 className="font-semibold">这不是什么</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {notList.map((t) => (
              <li
                key={t}
                className="flex gap-2.5 text-[15px] leading-relaxed text-ink-soft"
              >
                <span
                  aria-hidden="true"
                  className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-faint"
                />
                {t}
              </li>
            ))}
          </ul>
        </CardShell>

        <CardShell>
          <h2 className="font-semibold">你在这里说的话</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {privacyList.map((t) => (
              <li
                key={t}
                className="flex gap-2.5 text-[15px] leading-relaxed text-ink-soft"
              >
                <span
                  aria-hidden="true"
                  className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-faint"
                />
                {t}
              </li>
            ))}
          </ul>
          <ClearSessionButton />
        </CardShell>

        <div className="rounded-3xl border border-storm/20 bg-storm-soft p-5">
          <h2 className="font-semibold text-storm">紧急情况</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-storm/90">
            轻屿处理不了紧急情况。如果你此刻有伤害自己的念头，请现在就联系一个能找到的人，或拨打
            12356（中国大陆，24 小时）。港澳台与海外见资源页，紧急请拨打当地急救电话。
          </p>
          <Link
            href="/resources"
            className="mt-3 inline-block text-[15px] font-medium text-storm underline underline-offset-4"
          >
            查看更多支持资源
          </Link>
        </div>

        <p className="px-1 text-xs leading-relaxed text-ink-soft">
          如果它哪句话说得不合适，关掉就好，不用回复。
        </p>
      </div>
    </main>
  );
}
