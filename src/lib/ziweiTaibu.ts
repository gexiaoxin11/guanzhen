import { calculateZiwei, type ZiweiInput, type ZiweiOutput } from "taibu-core/ziwei";

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
): any {
  throw new Error("飞星排盘功能暂不可用");
  /* const input: any = {
    birthYear, birthMonth, birthDay, birthHour,
    calendarType: "solar",
    gender: gender === "男" ? "male" : "female",
    targetYear,
  };
  */
}

export type { ZiweiOutput };
