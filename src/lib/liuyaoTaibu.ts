import { calculateLiuyao, type LiuyaoInput, type LiuyaoOutput } from "taibu-core/liuyao";

export async function taibuAnalyzeLiuyao(
  hexagramName: string,
  changedHexagramName: string | undefined,
  question: string,
  date: string,
) {
  const input: LiuyaoInput = {
    question: question || "占事",
    yongShenTargets: ["妻财", "官鬼", "父母", "兄弟", "子孙"],
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
