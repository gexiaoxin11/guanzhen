import { calculateZiwei, calculateZiweiFlyingStar, type ZiweiInput, type ZiweiOutput, type ZiweiFlyingStarInput, type ZiweiFlyingStarOutput } from "taibu-core/ziwei";

export function taibuCalculateZiwei(birthYear: number, birthMonth: number, birthDay: number, birthHour: number, gender: "男" | "女"): ZiweiOutput {
  const input: ZiweiInput = {
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    calendarType: "solar",
    gender: gender === "男" ? "male" : "female",
  };
  return calculateZiwei(input);
}

export function taibuCalculateFlyingStar(
  birthYear: number, birthMonth: number, birthDay: number, birthHour: number,
  gender: "男" | "女",
  targetYear: number,
): ZiweiFlyingStarOutput {
  const input: ZiweiFlyingStarInput = {
    birthYear, birthMonth, birthDay, birthHour,
    calendarType: "solar",
    gender: gender === "男" ? "male" : "female",
    targetYear,
  };
  return calculateZiweiFlyingStar(input);
}

export type { ZiweiOutput, ZiweiFlyingStarOutput };
