"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ActionCard from "@/components/ActionCard";
import BatteryPicker from "@/components/BatteryPicker";
import CardShell from "@/components/CardShell";
import EmojiFeedback from "@/components/EmojiFeedback";
import ExitButton from "@/components/ExitButton";
import SafetyBanner from "@/components/SafetyBanner";
import SwipeCard from "@/components/SwipeCard";
import WeatherCards from "@/components/WeatherCards";
import { CatAvatar } from "@/components/mascots";
import type {
  Battery,
  Branch,
  CardAction,
  CardPayload,
  ChatResponse,
  WeatherId,
} from "@/lib/types";

type StreamItem =
  | { id: number; kind: "text"; from: "bot" | "user"; text: string }
  | { id: number; kind: "card"; card: CardPayload }
  | { id: number; kind: "banner" };

const batteryEcho: Record<Battery, string> = {
  1: "还剩一格",
  2: "还剩两格",
  3: "还剩三格",
};

function Chat() {
  const searchParams = useSearchParams();
  const branchParam = searchParams.get("branch");
  const branch: Branch | null =
    branchParam === "stabilize" || branchParam === "action" || branchParam === "explore"
      ? branchParam
      : null;

  const [items, setItems] = useState<StreamItem[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pushText = (from: "bot" | "user", text: string) =>
    setItems((prev) => [...prev, { id: ++idRef.current, kind: "text", from, text }]);

  const pushCard = (card: CardPayload) =>
    setItems((prev) => [...prev, { id: ++idRef.current, kind: "card", card }]);

  const pushBanner = () =>
    setItems((prev) => [...prev, { id: ++idRef.current, kind: "banner" }]);

  /** 卡片用完即收（一次只推一张） */
  const consumeLastCard = () =>
    setItems((prev) => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].kind === "card") return prev.filter((_, j) => j !== i);
      }
      return prev;
    });

  const applyResponse = (data: ChatResponse) => {
    pushText("bot", data.reply);
    if (data.safeMode) pushBanner();
    // 服务端保证一次最多一张卡
    for (const card of data.cards) pushCard(card);
  };

  // 进场：创建会话，拿固定开场白
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ branch }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ChatResponse;
        if (cancelled) return;
        sessionIdRef.current = data.sessionId;
        pushText("bot", data.reply);
        for (const card of data.cards) pushCard(card);
      } catch {
        if (!cancelled) pushText("bot", "好像没连上。刷新页面再试一次？");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch]);

  // 新内容出现时滚到底
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [items]);

  const send = useCallback(
    async (payload: { input?: string; cardAction?: CardAction }, userEcho?: string) => {
      if (busy) return;
      setBusy(true);
      if (userEcho) pushText("user", userEcho);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId: sessionIdRef.current, ...payload }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ChatResponse;
        sessionIdRef.current = data.sessionId || sessionIdRef.current;
        applyResponse(data);
      } catch {
        pushText("bot", "网络好像断了一下。想说的话，再发一次？");
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy],
  );

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void send({ input: text }, text);
  };

  const handleWeather = (id: WeatherId, label: string) => {
    consumeLastCard();
    void send({ cardAction: { type: "weather_select", value: id } }, label);
  };

  const handleWeatherSkip = () => {
    consumeLastCard();
    void send({ cardAction: { type: "weather_skip" } });
  };

  const handleBattery = (level: Battery) => {
    consumeLastCard();
    void send({ cardAction: { type: "battery", level } }, batteryEcho[level]);
  };

  const handleShuffle = () => {
    consumeLastCard();
    void send({ cardAction: { type: "shuffle" } });
  };

  const handleSkip = () => {
    consumeLastCard();
    void send({ cardAction: { type: "skip" } }, "不想做");
  };

  const handleDone = () => {
    consumeLastCard();
    void send({ cardAction: { type: "done" } }, "做完了");
  };

  const handleEmojiPick = (score: 1 | 2 | 3 | 4 | 5) => {
    consumeLastCard();
    // 只收一个表情，不写感受、不记时长；回执就一句
    void send({ cardAction: { type: "mood", score } });
  };

  /** 滑走 = 该卡片的「不做/跳过」路径（brief §3：任何卡片都可滑走，无挽留） */
  const dismissCard = (card: CardPayload) => {
    switch (card.type) {
      case "weather":
        handleWeatherSkip();
        break;
      case "battery":
        consumeLastCard();
        void send({ cardAction: { type: "skip" } });
        break;
      case "action":
        handleSkip();
        break;
      case "emoji":
        // 不选也行：滑走即静默跳过，不发送任何内容
        consumeLastCard();
        break;
    }
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-2.5 md:max-w-3xl">
          <Link href="/" className="text-base font-semibold tracking-tight">
            轻屿
          </Link>
          <ExitButton />
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 md:max-w-3xl">
          {items.map((item) => {
            if (item.kind === "banner") return <SafetyBanner key={item.id} />;
            if (item.kind === "card") {
              return (
                <SwipeCard
                  key={item.id}
                  className="fade-in"
                  onDismiss={() => dismissCard(item.card)}
                >
                  <CardShell>
                    {item.card.type === "weather" && (
                      <div>
                        <p className="text-sm text-ink-soft">
                          挑一个最接近的？说不准就跳过。
                        </p>
                        <WeatherCards onSelect={handleWeather} onSkip={handleWeatherSkip} />
                      </div>
                    )}
                    {item.card.type === "battery" && (
                      <div>
                        <p className="text-sm text-ink-soft">
                          现在还剩几格电？凭感觉选，不用准。
                        </p>
                        <BatteryPicker onSelect={handleBattery} />
                      </div>
                    )}
                    {item.card.type === "emoji" && (
                      <EmojiFeedback onPick={handleEmojiPick} />
                    )}
                    {item.card.type === "action" && (
                      <ActionCard
                        action={item.card.list[item.card.index]}
                        onDone={handleDone}
                        onShuffle={handleShuffle}
                        onSkip={handleSkip}
                      />
                    )}
                  </CardShell>
                </SwipeCard>
              );
            }
            return item.from === "bot" ? (
              <div key={item.id} className="fade-in flex items-end gap-2">
                <CatAvatar className="h-7 w-7 shrink-0 md:h-8 md:w-8" />
                <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-card px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-line md:max-w-[70%]">
                  {item.text}
                </p>
              </div>
            ) : (
              <p
                key={item.id}
                className="fade-in ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-sage px-4 py-2.5 text-[15px] leading-relaxed md:max-w-[70%]"
              >
                {item.text}
              </p>
            );
          })}
          {busy && (
            <p className="text-sm text-ink-faint" aria-live="polite">
              …
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="pb-safe border-t border-line bg-card px-3 pt-2.5"
      >
        <div className="mx-auto mb-2.5 flex w-full max-w-2xl items-center gap-2 px-0 md:max-w-3xl">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="想说的话"
            placeholder="想说什么都行，不说也行"
            enterKeyHint="send"
            disabled={busy}
            className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-[15px] outline-none transition placeholder:text-ink-soft focus:border-sage disabled:opacity-60 md:px-5"
          />
          <button
            type="submit"
            aria-label="发送"
            disabled={!input.trim() || busy}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage text-white transition hover:bg-sage-deep active:scale-95 disabled:opacity-40"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-dvh" />}>
      <Chat />
    </Suspense>
  );
}
