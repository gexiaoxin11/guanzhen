import { calculateLiuyao, type LiuyaoInput, type LiuyaoOutput, type LiuQinType } from "taibu-core/liuyao";

// 根据问题提取用神关键词
function extractYongShenTargets(question: string): LiuQinType[] {
  if (!question || question === "占事" || question.length < 2) return [];
  
  const targets: LiuQinType[] = [];
  const q = question.toLowerCase();
  
  // 妻财: 财运、生意、投资、求财、交易
  if (/财|钱|生意|投资|交易|买卖|盈利|收入|打工|薪资|工资/.test(q)) targets.push("妻财" as LiuQinType);
  // 官鬼: 事业、工作、考试、升职、官司、疾病、灾祸
  if (/事业|工作|升职|考试|官|讼|疾病|健康|病|灾|祸|求职|面试|笔试/.test(q)) targets.push("官鬼" as LiuQinType);
  // 父母: 学业、文书、房产、长辈
  if (/学业|文书|房产|房子|长辈|父母|母亲|父亲|证书|合同|文件|租房|买房/.test(q)) targets.push("父母" as LiuQinType);
  // 兄弟: 合作、同伴、竞争
  if (/兄弟|合作|合伙|同伴|竞争|对手/.test(q)) targets.push("兄弟" as LiuQinType);
  // 子孙: 平安、出行、旅游、娱乐、子嗣、宠物
  if (/平安|出行|旅游|娱乐|子|孩子|宠物|游玩/.test(q)) targets.push("子孙" as LiuQinType);
  
  // 如果没有任何关键词匹配，返回全系列让 taibu-core 自行判断
  if (targets.length === 0) targets.push("妻财" as LiuQinType, "官鬼" as LiuQinType, "父母" as LiuQinType, "兄弟" as LiuQinType, "子孙" as LiuQinType);
  
  return targets.filter((v, i, a) => a.indexOf(v) === i);
}

export async function taibuAnalyzeLiuyao(
  hexagramName: string,
  changedHexagramName: string | undefined,
  question: string,
  date: string,
) {
  const yongShenTargets = extractYongShenTargets(question);
  
  const input: LiuyaoInput = {
    question: question || "占事",
    yongShenTargets,
    method: "select",
    hexagramName,
    changedHexagramName,
    date,
    detailLevel: "full",
  };
  return calculateLiuyao(input);
}

export async function taibuBasicLiuyao(input: LiuyaoInput): Promise<LiuyaoOutput> {
  return calculateLiuyao(input);
}
