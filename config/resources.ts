import type { RegionInfo, ResourceEntry } from "@/lib/types";

// 资源配置（brief §7.6：按地区区分中国大陆 / 港澳台 / 海外）。
// reviewed=false 表示号码来自公开资料、尚未人工复核：
// 页面必须始终附带「以官方页面为准」的提示，不得给出有效性承诺。
// ⚠️ 上线前需逐条人工复核（brief 确认时约定）。

export const regions: RegionInfo[] = [
  { id: "cn", label: "中国大陆" },
  { id: "hmt", label: "港澳台" },
  { id: "overseas", label: "海外" },
];

export const resources: ResourceEntry[] = [
  // ---- 中国大陆 ----
  {
    id: "cn-12356",
    region: "cn",
    name: "全国心理援助热线",
    phone: "12356",
    hours: "24 小时",
    note: "中国大陆统一短号",
    reviewed: false,
  },
  {
    id: "cn-hope24",
    region: "cn",
    name: "希望24热线",
    phone: "400-161-9995",
    hours: "24 小时",
    reviewed: false,
  },
  {
    id: "cn-beijing",
    region: "cn",
    name: "北京心理危机研究与干预中心",
    phone: "010-82951332",
    hours: "24 小时",
    note: "北京地区，全国可拨",
    reviewed: false,
  },
  // ---- 港澳台 ----
  {
    id: "hmt-hk-samaritan",
    region: "hmt",
    name: "香港 · 撒玛利亚防止自杀会",
    phone: "2389 2222",
    hours: "24 小时",
    reviewed: false,
  },
  {
    id: "hmt-tw-1925",
    region: "hmt",
    name: "台湾 · 安心专线",
    phone: "1925",
    hours: "24 小时",
    note: "依样爱我（谐音）",
    reviewed: false,
  },
  {
    id: "hmt-tw-1995",
    region: "hmt",
    name: "台湾 · 生命线",
    phone: "1995",
    hours: "24 小时",
    reviewed: false,
  },
  // ---- 海外（部分已知地区示例；其余见下方通用建议） ----
  {
    id: "os-us-988",
    region: "overseas",
    name: "美国 · Suicide & Crisis Lifeline",
    phone: "988",
    hours: "24 小时",
    reviewed: false,
  },
  {
    id: "os-uk-samaritans",
    region: "overseas",
    name: "英国 · Samaritans",
    phone: "116 123",
    hours: "24 小时",
    reviewed: false,
  },
  {
    id: "os-au-lifeline",
    region: "overseas",
    name: "澳大利亚 · Lifeline",
    phone: "13 11 14",
    hours: "24 小时",
    reviewed: false,
  },
];

// 找不到地区资源时的兜底（brief §7.6：通用建议 + 当地急救号码提示）
export const overseasFallback = {
  title: "在海外或没找到所在地区？",
  text: "可以搜索你所在地区的 crisis line（危机热线），或拨打当地急救电话。上面只列了少数几个已知地区，号码可能变动，以当地官方页面为准。",
};

/** 提示词注入用（{locale_resources}）：单行、可朗读的资源清单。M4 按地区完善。 */
export function localeResourcesText(_locale = "zh-CN"): string {
  return resources
    .filter((r) => r.region === "cn")
    .map((r) => `${r.name} ${r.phone}${r.hours ? `（${r.hours}）` : ""}`)
    .join("；");
}
