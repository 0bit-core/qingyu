// 确定性规范闸（输出审查的第三道，brief §5/§7 的加强项）。
// 不依赖模型：对候选回复做字符串级检查，专抓最明显的违规。
// 位置：L5 审查（语义层）通过之后；命中即视为审查不通过，
// 走既有 rewrite → fallback 流程。仅在真实模式生效。

const BANNED: { re: RegExp; reason: string; hint: string }[] = [
  // 诊断标签
  {
    re: /抑郁症|焦虑症|强迫症|双相|精神分裂|躁郁|确诊|典型的?(症状|表现|案例)|你这是(典型|明显)/,
    reason: "出现诊断标签",
    hint: "删掉诊断性表述，只描述感受，不贴标签",
  },
  // 药物与治疗承诺
  {
    re: /吃(点|些|个|这|那)?药|服药|用药|药物|剂量|处方|安眠药|抗抑郁|住院治疗|电休克/,
    reason: "涉及药物建议",
    hint: "删除所有药物与治疗相关内容",
  },
  {
    re: /治疗|疗程|康复训练|认知行为疗法|CBT|暴露疗法|系统脱敏/,
    reason: "治疗方法承诺",
    hint: "删除治疗方法表述，陪伴不谈疗法",
  },
  // 否定感受
  {
    re: /想开点|别多想|多想想好事|这没什么大不了|不至于|太矫情|想太多|看开些/,
    reason: "否定感受的表达",
    hint: "改为先承认感受，不给评判",
  },
  // 依赖诱导 / 保密承诺
  {
    re: /我会?一直(陪|在)|永远(在|陪|等你)|我们的?(小)?秘密|不会告诉任何人|随时(都)?(找|call)我|秒回/,
    reason: "依赖诱导或保密承诺",
    hint: "删掉承诺式表达，可以留下「随时可以回来」级别的中性说法",
  },
  // 评估式语言
  {
    re: /评估|量表|测评|测一测|打分|筛查|心理测试/,
    reason: "评估式语言",
    hint: "改成日常对话的说法，不做任何评估",
  },
  // 产品说明式语言
  {
    re: /本功能|本产品|该功能|在下方(选择|点击|输入)|系统(会|将)|用户(可以|能够)/,
    reason: "产品说明式语言",
    hint: "去掉产品说明式表述，像朋友一样说话",
  },
  // 清单 / 多步骤
  {
    re: /(^|\n)\s*(\d{1,2}[.、)）]|[①②③④⑤]|第[一二三四五六]步)/,
    reason: "出现清单或多步骤",
    hint: "只保留一个轻动作，其余删掉",
  },
];

export type GuardVerdict = { pass: boolean; reason: string; rewrite_hint: string };

const GUARD_PASS: GuardVerdict = { pass: true, reason: "无", rewrite_hint: "无" };

export function styleGuard(reply: string): GuardVerdict {
  const text = reply.trim();
  if (!text) return { pass: false, reason: "空回复", rewrite_hint: "给出正常回应" };

  for (const rule of BANNED) {
    if (rule.re.test(text)) {
      return { pass: false, reason: rule.reason, rewrite_hint: rule.hint };
    }
  }

  // 长度闸：规范是一次不超过 3 句，硬上限 5 句
  const sentences = text
    .split(/[。！？!?\n]+/)
    .filter((s) => s.trim().length > 0).length;
  if (sentences > 5) {
    return { pass: false, reason: "回复过长", rewrite_hint: "压缩到 3 句以内" };
  }

  return GUARD_PASS;
}
