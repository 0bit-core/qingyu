import type { QuietWords } from "@/lib/types";

// /quiet 页的轻内容。语气基准：不劝、不打鸡血、不催改变。
// 用词约束：不出现「练习 / 训练 / 疗程 / 评估」等词（brief §3）。

export const quietWords: QuietWords[] = [
  { id: "w1", text: "今天不用变得更好。你已经把今天过到这儿了。" },
  { id: "w2", text: "事情没做完，不代表你做得不够。有些事本来就是做不完的。" },
  { id: "w3", text: "累不是懒，是电量真的低了。" },
  { id: "w4", text: "不用急着有什么感受。空一会儿，也是一种待法。" },
];

export const breathCaption = "跟着圆点：吸——，呼——。20 秒后它自己会停。";
export const breathDone = "就到这儿，挺好。想再来就再点一下。";
