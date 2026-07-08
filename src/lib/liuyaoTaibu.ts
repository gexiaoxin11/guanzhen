import { calculateLiuyao, performFullAnalysis, type LiuyaoInput, type LiuyaoOutput } from "taibu-core/liuyao";

/**
 * Bridge our LiuyaoChart to taibu-core's LiuyaoInput for enhanced analysis.
 */
export function taibuAnalyzeLiuyao(
  hexagramName: string,
  changedHexagramName: string | undefined,
  question: string,
  date: string,
): ReturnType<typeof performFullAnalysis> {
  const input: LiuyaoInput = {
    question: question || "占事",
    yongShenTargets: [],
    method: "select",
    hexagramName,
    changedHexagramName,
    date,
    detailLevel: "full",
  };
  try {
    return performFullAnalysis(input);
  } catch {
    // Fallback to basic calculation
    return calculateLiuyao(input) as ReturnType<typeof performFullAnalysis>;
  }
}

export function taibuBasicLiuyao(input: LiuyaoInput): LiuyaoOutput {
  return calculateLiuyao(input);
}
