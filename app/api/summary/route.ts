import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/** GET /api/summary?sessionId= —— 调试用，返回状态摘要（brief §5） */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }
  return NextResponse.json({
    sessionId: session.id,
    stage: session.stage,
    riskFlag: session.riskFlag,
    riskNote: session.riskNote,
    noRiskStreak: session.noRiskStreak,
    denied: session.denied,
    validationOnlyStreak: session.validationOnlyStreak,
    ruminationRounds: session.ruminationRounds,
    userStateSummary: session.userStateSummary,
    turnsCount: session.turns.length,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  });
}
