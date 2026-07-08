// Shared Ziwei-style time control constants
export const TIME_OPTIONS = [
  { label: "子时 (23-01)", value: 0 },
  { label: "丑时 (01-03)", value: 1 },
  { label: "寅时 (03-05)", value: 2 },
  { label: "卯时 (05-07)", value: 3 },
  { label: "辰时 (07-09)", value: 4 },
  { label: "巳时 (09-11)", value: 5 },
  { label: "午时 (11-13)", value: 6 },
  { label: "未时 (13-15)", value: 7 },
  { label: "申时 (15-17)", value: 8 },
  { label: "酉时 (17-19)", value: 9 },
  { label: "戌时 (19-21)", value: 10 },
  { label: "亥时 (21-23)", value: 11 },
];

export const HOUR_STARTS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

/** Parse "1990-01-01" + timeIndex -> { year, month, day, hour } */
export function dateTimeFromParts(birthDate: string, timeIndex: number) {
  const [y, m, d] = birthDate.split("-").map(Number);
  const hour = HOUR_STARTS[timeIndex] || 0;
  return { year: y, month: m, day: d, hour, minute: 0 };
}
