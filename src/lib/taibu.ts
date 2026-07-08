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

export async function runLiuyao(input: LiuyaoInput) {
  return performFullAnalysis(input);
}

export async function runLiuyaoBasic(input: LiuyaoInput): Promise<LiuyaoOutput> {
  return calculateLiuyao(input);
}

export function runZiwei(input: ZiweiInput): ZiweiOutput {
  return calculateZiwei(input);
}

export function runZiweiFlyingStar(input: ZiweiFlyingStarInput): ZiweiFlyingStarOutput {
  return calculateZiweiFlyingStar(input);
}

export async function runBazi(input: BaziInput): Promise<BaziOutput> {
  return calculateBazi(input);
}

export async function runBaziShenSha(input: BaziInput): Promise<BaziShenShaOutput> {
  return calculateBaziShenShaData(input);
}

export async function runQimen(input: QimenInput): Promise<QimenOutput> {
  return calculateQimen(input);
}

export async function runDaliuren(input: DaliurenInput): Promise<DaliurenOutput> {
  return calculateDaliuren(input);
}

export async function runMeihua(input: MeihuaInput): Promise<MeihuaOutput> {
  return calculateMeihua(input);
}
