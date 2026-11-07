"use client";

import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

/**
 * 可滑走的卡片容器（brief §3：任何卡片都可滑走）。
 * Pointer 事件实现，触屏与鼠标都可用；阈值 80px 触发 onDismiss。
 * 拖拽全程直接操作 style，不经 React 状态——卡片内按钮点击零干扰。
 * 键盘路径不受影响：卡片内按钮仍可 Tab 聚焦，滑走只是增强。
 */
const DISMISS_THRESHOLD = 80;
const CAPTURE_THRESHOLD = 6;

export default function SwipeCard({
  children,
  onDismiss,
  className = "",
}: {
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const dx = useRef(0);
  const active = useRef(false);
  const captured = useRef(false);

  const applyStyle = (value: number, moving: boolean) => {
    const el = elRef.current;
    if (!el) return;
    el.style.transform = `translateX(${value}px)`;
    el.style.opacity = String(1 - Math.min(Math.abs(value) / 240, 0.4));
    el.style.transition = moving
      ? "none"
      : "transform 0.18s ease, opacity 0.18s ease";
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // 触摸/鼠标主键才拖动；落在可交互元素上的按压不启动拖拽（按钮点击零干扰）
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select")) return;
    active.current = true;
    captured.current = false;
    startX.current = e.clientX;
    applyStyle(0, true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!active.current) return;
    dx.current = e.clientX - startX.current;
    if (!captured.current && Math.abs(dx.current) > CAPTURE_THRESHOLD) {
      captured.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    applyStyle(dx.current, true);
  };

  const settle = () => {
    if (!active.current) return;
    active.current = false;
    captured.current = false;
    const dismissed = Math.abs(dx.current) >= DISMISS_THRESHOLD;
    applyStyle(0, false);
    dx.current = 0;
    if (dismissed) onDismiss?.();
  };

  return (
    <div
      ref={elRef}
      className={`touch-pan-y select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={settle}
      onPointerCancel={settle}
    >
      {children}
    </div>
  );
}
