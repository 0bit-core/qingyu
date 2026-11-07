import { NextResponse } from "next/server";
import { overseasFallback, regions, resources } from "@/config/resources";

/** GET /api/resources?locale= —— 资源列表（静态配置驱动；M4 完整按地区过滤） */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") ?? process.env.APP_LOCALE ?? "zh-CN";
  return NextResponse.json({
    locale,
    regions,
    resources,
    overseasFallback,
  });
}
