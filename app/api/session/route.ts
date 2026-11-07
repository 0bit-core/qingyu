import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logPipeline } from "@/lib/logger";
import { openingFor } from "@/lib/mockContent";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSession,
  deleteSession,
  saveSession,
} from "@/lib/session";
import type { Branch } from "@/lib/types";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

function parseBranch(v: unknown): Branch | null {
  return v === "explore" || v === "stabilize" || v === "action" ? v : null;
}

/** 创建会话，返回 sessionId（httpOnly cookie 承载）+ 固定开场白 */
export async function POST(req: Request) {
  let branch: Branch | null = null;
  try {
    branch = parseBranch((await req.json())?.branch);
  } catch {
    /* 无 body 也允许 */
  }
  const session = await createSession(branch);
  const opening = openingFor(branch);
  session.turns.push({ role: "assistant", content: opening.reply });
  await saveSession(session);
  logPipeline({
    sessionId: session.id,
    turn: 0,
    stage: "session_created",
    detail: { branch },
  });
  const res = NextResponse.json({
    sessionId: session.id,
    reply: opening.reply,
    cards: opening.cards,
    stage: session.stage,
    safeMode: false,
  });
  res.cookies.set(SESSION_COOKIE, session.id, COOKIE_OPTS);
  return res;
}

/** 清除本次会话（/about 承诺的清除方式；M5 前端接按钮） */
export async function DELETE() {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (id) await deleteSession(id);
  const res = NextResponse.json({ cleared: true });
  res.cookies.set(SESSION_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
