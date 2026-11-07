"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** 桌面端顶部导航（md 及以上显示；对话页保持沉浸式，不出现） */
const links = [
  { href: "/", label: "首页" },
  { href: "/quiet", label: "静一静" },
  { href: "/resources", label: "资源" },
  { href: "/about", label: "关于" },
] as const;

export default function DesktopNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/chat")) return null;

  return (
    <header className="hidden sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur md:block">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          轻屿
        </Link>
        <nav aria-label="页面导航" className="flex items-center gap-7">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm transition-colors ${
                  active
                    ? "font-medium text-sage-deep"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
