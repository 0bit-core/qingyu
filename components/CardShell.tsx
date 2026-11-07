import type { ReactNode } from "react";

/** 卡片容器：大圆角、细边框、轻投影。M5 在此加滑走手势。 */
export default function CardShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(51,64,62,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
