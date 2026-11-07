import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generalFallback } from "@/lib/fallback";
import { handleChatTurn } from "@/lib/pipeline";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  getSession,
} from "@/lib/session";
import type {
  Battery,
  Branch,
  CardAction,
  ChatResponse,
  WeatherId,
} from "@/lib/types";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

function parseBranch(v: unknown): Branch | null {
  return v === "explore" || v === "stabilize" || v === "action" ? v : null;
}

function parseCardAction(v: unknown): CardAction | null {
  if (!v || typeof v !== "object") return null;
  const a = v as Record<string, unknown>;
  switch (a.type) {
    case "weather_select":
      if (typeof a.value === "string" && ["men", "piao", "chen", "ci", "kong"].includes(a.value)) {
        return { type: "weather_select", value: a.value as WeatherId };
      }
      return null;
    case "weather_skip":
      return { type: "weather_skip" };
    case "battery":
      if (a.level === 1 || a.level === 2 || a.level === 3) {
        return { type: "battery", level: a.level as Battery };
      }
      return null;
    case "shuffle":
      return { type: "shuffle" };
    case "skip":
      return { type: "skip" };
    case "done":
      return { type: "done" };
    case "mood":
      if (a.score === 1 || a.score === 2 || a.score === 3 || a.score === 4 || a.score === 5) {
        return { type: "mood", score: a.score };
      }
      return null;
    default:
      return null;
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* 允许空 body，走 cookie 会话 */
  }

  const cookieStore = await cookies();
  const sid =
    (typeof body.sessionId === "string" && body.sessionId) ||
    cookieStore.get(SESSION_COOKIE)?.value ||
    null;
  const input = typeof body.input === "string" ? body.input.trim().slice(0, 2000) : "";
  const cardAction = parseCardAction(body.cardAction);
  const branch = parseBranch(body.branch);

  if (!input && !cardAction) {
    return NextResponse.json({ error: "input or cardAction required" }, { status: 400 });
  }

  try {
    const result = await handleChatTurn({ sessionId: sid, input, cardAction, branch });
    const res = NextResponse.json(result);
    res.cookies.set(SESSION_COOKIE, result.sessionId, COOKIE_OPTS);
    return res;
  } catch (err) {
    // 管线意外异常：返回人工审定兜底，不报错给用户（brief §5）
    console.error("[qingyu] pipeline crashed", err);
    const session = await getSession(sid);
    const result: ChatResponse = {
      sessionId: session?.id ?? sid ?? "",
      reply: generalFallback,
      cards: [],
      stage: session?.stage ?? "explore",
      safeMode: false,
      fallback: true,
    };
    const res = NextResponse.json(result);
    if (result.sessionId) {
      res.cookies.set(SESSION_COOKIE, result.sessionId, COOKIE_OPTS);
    }
    return res;
  }
}
