import {
  calculateLiuyao,
  performFullAnalysis,
  type LiuyaoInput,
  type LiuyaoOutput,
} from "taibu-core/liuyao";
import { calculateZiwei, calculateZiweiFlyingStar, type ZiweiInput, type ZiweiOutput, type ZiweiFlyingStarInput, type ZiweiFlyingStarOutput } from "taibu-core/ziwei";
import { calculateBazi, calculateBaziShenShaData, type BaziInput, type BaziOutput, type BaziShenShaOutput } from "taibu-core/bazi";
import { calculateQimen, type QimenInput, type QimenOutput } from "taibu-core/qimen";
import { calculateDaliuren, type DaliurenInput, type DaliurenOutput } from "taibu-core/daliuren";
import { calculateMeihua, type MeihuaInput, type MeihuaOutput } from "taibu-core/meihua";

export type { LiuyaoInput, LiuyaoOutput, ZiweiInput, ZiweiOutput, BaziInput, BaziOutput, BaziShenShaOutput, QimenInput, QimenOutput, DaliurenInput, DaliurenOutput, MeihuaInput, MeihuaOutput, ZiweiFlyingStarInput, ZiweiFlyingStarOutput };

export function runLiuyao(input: LiuyaoInput): ReturnType<typeof performFullAnalysis> {
  return performFullAnalysis(input);
}

export function runLiuyaoBasic(input: LiuyaoInput): LiuyaoOutput {
  return calculateLiuyao(input);
}

export function runZiwei(input: ZiweiInput): ZiweiOutput {
  return calculateZiwei(input);
}

export function runZiweiFlyingStar(input: ZiweiFlyingStarInput): ZiweiFlyingStarOutput {
  return calculateZiweiFlyingStar(input);
}

export function runBazi(input: BaziInput): BaziOutput {
  return calculateBazi(input);
}

export function runBaziShenSha(input: BaziInput): BaziShenShaOutput {
  return calculateBaziShenShaData(input);
}

export function runQimen(input: QimenInput): QimenOutput {
  return calculateQimen(input);
}

export function runDaliuren(input: DaliurenInput): DaliurenOutput {
  return calculateDaliuren(input);
}

export function runMeihua(input: MeihuaInput): MeihuaOutput {
  return calculateMeihua(input);
}
