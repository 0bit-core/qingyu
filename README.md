# 轻屿（Qingyu）

面向亚临床焦虑与低落情绪的日常轻陪伴网站。不做诊断、不做治疗；
前台没有量表、没有打卡、没有排行，阶段路由与风险筛查全部在后台，对用户不可见。

核心原则：降低表达负担、降低承诺压力、降低被审视感。

## 当前状态

全部里程碑完成：

- [x] **M1 骨架与前端**：五个页面 + 本地 mock 卡片流
- [x] **M2 会话与管线**：session（httpOnly cookie）、/api/chat 五步链路、mock 模式、分段日志
- [x] **M3 提示词接入**：prompts/ 11 个资产原样接线、阶段路由、安全替换、stub 实测真实模式
- [x] **M4 安全与兜底**：riskRules 完整版（含弱信号两级）、否认降级通道、资源全量、超时降级
- [x] **M5 体验打磨**：滑走手势、表情反馈、清除会话、404/空态、无障碍

## 本地运行

```bash
npm install
npm run dev   # http://localhost:3000
```

未配置任何环境变量时即为 **mock 模式**，全站可完整演示。

> 本机若没有全局 Node：便携版在 `C:\Users\34065\tools\node-dl\node-v22.23.4-win-x64`，
> 把该目录加入 PATH 即可（Git Bash：`export PATH="/c/Users/34065/tools/node-dl/node-v22.23.4-win-x64:$PATH"`）。

## 环境变量

见 `.env.example`。`LLM_API_KEY` 留空即 mock 模式；
配置后走 OpenAI 兼容协议（`LLM_BASE_URL`），主/小模型分开（`LLM_MODEL_MAIN` / `LLM_MODEL_SMALL`）。

### 本地联调真实模式（无需 API key）

```bash
node scripts/llm-stub.mjs            # 场景：normal | rewrite | risk | always_fail | slow
LLM_API_KEY=stub LLM_PROVIDER=stub LLM_BASE_URL=http://127.0.0.1:5099/v1 \
LLM_MODEL_MAIN=stub-main LLM_MODEL_SMALL=stub-small npm run dev
```

## 测试

```bash
node --experimental-strip-types scripts/test-risk-rules.mjs   # 风险规则断言（29 例）
```

## 目录结构

```
app/            五个页面 + api/{session,chat,resources,summary} + not-found
lib/            pipeline.ts（五步链路） llm.ts（封装+mock） prompts.ts（读取组装）
                riskRules.ts（双通道规则） fallback.ts（人工审定兜底）
                session.ts store.ts（内存+TTL2h） logger.ts mockContent.ts types.ts
prompts/        L0–L5 提示词资产（运行时原样读取，不在代码中改写）
config/         resources.ts（按地区） emergency.ts（紧急提示语，待人工审定） quiet.ts
components/     EntryCards WeatherCards ActionCard BatteryPicker EmojiFeedback
                SwipeCard CardShell ExitButton BottomNav SafetyBanner ClearSessionButton
scripts/        llm-stub.mjs（OpenAI 兼容联调 stub） test-risk-rules.mjs
```

## 管线（每轮对话，顺序不可合并）

```
输入 → ① 风险分类（小模型 + 关键词规则，取高）
     → ② 读取状态摘要
     → ③ 阶段决策（≥elevated → L3_safety 替换式接管；overload → 稳定化；resistance → 不推进）
     → ④ 主生成（L0+L1+阶段提示词）
     → ⑤ 输出审查（不过 → 按 rewrite_hint 重写一次 → 仍不过 → 人工审定兜底）
     → ⑥ 摘要更新 → 写回会话
卡片交互（选天气/电量/换一张/不想做/做完/表情）走固定话术，不经 LLM
```

日志：每段一行 JSON，`grep "[qingyu]"` 即可逐段观测。

## 安全红线（摘要，全文见 brief §7）

- 风险识别不靠主生成模型：小模型分类器 + 关键词/正则双通道，取高
- 会话 `risk_flag` 只升不降（例外：明确否认且连续 3 轮无信号，且 crisis 不降）
- `risk_level ≥ elevated` 时安全提示词**替换**（非追加）当前阶段
- 任何 LLM 失败/审查不通过 → `lib/fallback.ts` 人工审定兜底
- 兜底与紧急提示语为人工审定资产，不得由模型生成、不得改写
- 会话数据默认不落库，内存约 2 小时 TTL，`/about` 可一键清除
- ⚠️ 上线前必须人工复核：`config/emergency.ts`（紧急提示语占位稿）与
  `config/resources.ts` 全部热线号码（均为 `reviewed:false`）
