// 本地 OpenAI 兼容 stub：用于在没有 API key 时实测 lib/llm.ts 的真实模式路径
// （fetch、JSON 解析、审查-重写循环、超时与失败降级）。
//
// 用法：node scripts/llm-stub.mjs [scenario]
//   normal      默认：router/main/review/summary 全部正常
//   rewrite     主生成首版违规（依赖诱导+否定感受），审查不放行 → 触发重写
//   risk        路由分类器返回 elevated → 验证安全分支替换
//   card        路由返回 stabilize，卡片生成器返回合法卡 → 验证 AI 卡片
//   badcard     卡片生成器返回违规卡（跑步）→ 验证 cardGuard 拦截并降级静态库
//   always_fail 全部请求 500 → 验证降级兜底
//   slow        主生成延迟 25s → 触发 20s 超时 → 验证降级兜底
//
// 配套环境变量（真实模式）：
//   LLM_API_KEY=stub LLM_PROVIDER=stub LLM_BASE_URL=http://127.0.0.1:5099/v1
//   LLM_MODEL_MAIN=stub-main LLM_MODEL_SMALL=stub-small

import http from "node:http";

const scenario = process.argv[2] || "normal";
const port = Number(process.env.STUB_PORT || 5099);

const routerJson = (risk) =>
  JSON.stringify({
    risk_level: risk,
    risk_evidence: risk === "none" ? "无" : "如果我不在了",
    emotion_tags: ["低落"],
    intensity: 3,
    topic: "无明确主题",
    stage_signal:
      scenario === "card" || scenario === "badcard" ? "stabilize" : "explore",
    resistance: false,
    overload: false,
    rumination_rounds: 0,
    validation_only_streak: 0,
  });

const summaryJson = JSON.stringify({
  mood_trend: "持平",
  current_intensity: 2,
  recurring_themes: [],
  what_helped: [],
  risk_flag: "none",
  risk_note: "无",
  stage: "explore",
  open_loop: "无",
});

const UNSAFE_REPLY = "别难过，我会一直陪着你。想开点，明天会更好。";
const REWRITE_REPLY = "（stub·改）这句话现在音量很大。愿意说说它是从哪儿冒出来的吗？";
const NORMAL_REPLY = "（stub）嗯，我在。想说点什么都行。";
const SAFE_REPLY = "（stub·safe）你刚才说的让我有点担心你。你现在是安全的吗？有没有想伤害自己的念头？";

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (scenario === "always_fail") {
      res.writeHead(500, { "content-type": "application/json" });
      res.end('{"error":"stub always_fail"}');
      return;
    }
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const system = payload.messages?.[0]?.content ?? "";
    const user = payload.messages?.[1]?.content ?? "";

    const reply = (text) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: text } }] }));
    };

    // —— 小模型：路由分类器 ——
    if (system.includes("路由分类器")) {
      reply(routerJson(scenario === "risk" ? "elevated" : "none"));
      return;
    }
    // —— 小模型：状态摘要器 ——
    if (system.includes("状态摘要器")) {
      reply(summaryJson);
      return;
    }
    // —— 小模型：微动作卡片生成器 ——
    if (system.includes("微动作卡片生成器")) {
      reply(
        scenario === "badcard"
          ? JSON.stringify({
              title: "出门跑步五公里",
              body: "跑起来，出一身汗，别停。坚持住。",
              kind: "move",
            })
          : JSON.stringify({
              title: "看看窗外最远的屋顶",
              body: "找到能看到的最远一点，看三十秒。",
              kind: "sense",
            }),
      );
      return;
    }
    // —— 小模型：输出审查器（真的按内容审查违规词） ——
    if (system.includes("输出审查器")) {
      if (user.includes("我会一直陪着你") || user.includes("想开点")) {
        reply(
          JSON.stringify({
            pass: false,
            reason: "出现依赖诱导与否定感受表达",
            rewrite_hint: "删掉承诺式表达，改成开放式提问",
          }),
        );
      } else {
        reply(JSON.stringify({ pass: true, reason: "无", rewrite_hint: "无" }));
      }
      return;
    }
    // —— 主模型 ——
    if (scenario === "slow") {
      setTimeout(() => reply(NORMAL_REPLY), 25_000);
      return;
    }
    if (system.includes("当前阶段：安全")) {
      reply(SAFE_REPLY);
      return;
    }
    if (scenario === "rewrite") {
      reply(user.includes("重写方向") ? REWRITE_REPLY : UNSAFE_REPLY);
      return;
    }
    reply(NORMAL_REPLY);
  });
});

server.listen(port, () => {
  console.log(`[llm-stub] scenario=${scenario} listening on http://127.0.0.1:${port}/v1`);
});
