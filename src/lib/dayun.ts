// 八字大运计算
const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 六十甲子表
const SIXTY_JIAZI: string[] = [];
for (let i = 0; i < 60; i++) {
  SIXTY_JIAZI.push(GAN[i % 10] + ZHI[i % 12]);
}

// 节气日期近似表 (按月份，日期的近似值，实际需根据年份微调)
const JIE_QI_APPROX: Record<number, { name: string; day: number }> = {
  1:  { name: "小寒", day: 6 },
  2:  { name: "立春", day: 4 },
  3:  { name: "惊蛰", day: 6 },
  4:  { name: "清明", day: 5 },
  5:  { name: "立夏", day: 6 },
  6:  { name: "芒种", day: 6 },
  7:  { name: "小暑", day: 7 },
  8:  { name: "立秋", day: 8 },
  9:  { name: "白露", day: 8 },
  10: { name: "寒露", day: 8 },
  11: { name: "立冬", day: 8 },
  12: { name: "大雪", day: 7 },
};

export interface DayunItem {
  age: string;
  ganZhi: string;
  tenGod: string;
}

// 计算起运岁数和大运
export function calculateDayun(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  yearGan: string,
  monthGanZhi: string,
  gender: "male" | "female"
): { startAge: number; dayunList: DayunItem[] } {
  // 阳年：年干为甲丙戊庚壬
  const yangYear = ["甲", "丙", "戊", "庚", "壬"].includes(yearGan);
  const isMale = gender === "male";
  // 顺排：阳男、阴女；逆排：阴男、阳女
  const forward = (yangYear && isMale) || (!yangYear && !isMale);

  // 近似计算起运岁数：到最近节气的天数 / 3
  let jieQiDay: number;
  let jieQiMonth: number;
  
  if (forward) {
    // 顺排：找下一个节气
    jieQiMonth = birthMonth + 1;
    if (jieQiMonth > 12) jieQiMonth = 1;
    // 如果生日在本月节气之后，取下一月节气
    const thisMonthJQ = JIE_QI_APPROX[birthMonth];
    if (thisMonthJQ && birthDay > thisMonthJQ.day) {
      jieQiMonth = birthMonth + 1;
      if (jieQiMonth > 12) jieQiMonth = 1;
    }
    jieQiDay = JIE_QI_APPROX[jieQiMonth]?.day ?? 6;
  } else {
    // 逆排：找上一个节气
    jieQiMonth = birthMonth;
    const thisMonthJQ = JIE_QI_APPROX[birthMonth];
    if (thisMonthJQ && birthDay <= thisMonthJQ.day) {
      jieQiMonth = birthMonth - 1;
      if (jieQiMonth < 1) jieQiMonth = 12;
    }
    jieQiDay = JIE_QI_APPROX[jieQiMonth]?.day ?? 6;
  }

  // 简化的天数差
  let dayDiff: number;
  if (forward) {
    dayDiff = (jieQiDay - birthDay + 30) % 30;
    if (dayDiff === 0) dayDiff = 30;
  } else {
    dayDiff = (birthDay - jieQiDay + 30) % 30;
    if (dayDiff === 0) dayDiff = 30;
  }
  
  const startAge = Math.max(1, Math.round(dayDiff / 3));
  
  // 生成大运列表（8个大运 = 80年）
  const monthIdx = SIXTY_JIAZI.indexOf(monthGanZhi);
  const dayunList: DayunItem[] = [];
  
  for (let i = 0; i < 8; i++) {
    const shift = forward ? i + 1 : -(i + 1);
    let idx = (monthIdx + shift) % 60;
    if (idx < 0) idx += 60;
    const gz = SIXTY_JIAZI[idx];
    const gan = gz[0];
    
    // 十神计算
    const tenGod = getTenGod(yearGan, gan);
    
    dayunList.push({
      age: `${startAge + i * 10}-${startAge + i * 10 + 9}岁`,
      ganZhi: gz,
      tenGod,
    });
  }
  
  return { startAge, dayunList };
}

// 十神计算（简化版）
function getTenGod(dayGan: string, targetGan: string): string {
  const ganIdx = GAN.indexOf(dayGan);
  const targetIdx = GAN.indexOf(targetGan);
  const diff = (targetIdx - ganIdx + 10) % 10;
  
  // 同阴阳为偏，异阴阳为正中
  const sameYinYang = (targetIdx % 2) === (ganIdx % 2);
  
  if (diff === 0) return "比肩";
  if (diff === 5) return sameYinYang ? "比肩" : "劫财";
  if (diff === 1 || diff === 6) return sameYinYang ? "偏印" : "正印";
  if (diff === 2 || diff === 7) return sameYinYang ? "七杀" : "正官";
  if (diff === 3 || diff === 8) return sameYinYang ? "偏财" : "正财";
  if (diff === 4 || diff === 9) return sameYinYang ? "食神" : "伤官";
  return "未知";
}

// 六十甲子纳音表
const NAYIN_TABLE: Record<string, string> = {
  "甲子": "海中金", "乙丑": "海中金", "丙寅": "炉中火", "丁卯": "炉中火",
  "戊辰": "大林木", "己巳": "大林木", "庚午": "路旁土", "辛未": "路旁土",
  "壬申": "剑锋金", "癸酉": "剑锋金", "甲戌": "山头火", "乙亥": "山头火",
  "丙子": "涧下水", "丁丑": "涧下水", "戊寅": "城头土", "己卯": "城头土",
  "庚辰": "白蜡金", "辛巳": "白蜡金", "壬午": "杨柳木", "癸未": "杨柳木",
  "甲申": "泉中水", "乙酉": "泉中水", "丙戌": "屋上土", "丁亥": "屋上土",
  "戊子": "霹雳火", "己丑": "霹雳火", "庚寅": "松柏木", "辛卯": "松柏木",
  "壬辰": "长流水", "癸巳": "长流水", "甲午": "沙中金", "乙未": "沙中金",
  "丙申": "山下火", "丁酉": "山下火", "戊戌": "平地木", "己亥": "平地木",
  "庚子": "壁上土", "辛丑": "壁上土", "壬寅": "金箔金", "癸卯": "金箔金",
  "甲辰": "覆灯火", "乙巳": "覆灯火", "丙午": "天河水", "丁未": "天河水",
  "戊申": "大驿土", "己酉": "大驿土", "庚戌": "钗钏金", "辛亥": "钗钏金",
  "壬子": "桑柘木", "癸丑": "桑柘木", "甲寅": "大溪水", "乙卯": "大溪水",
  "丙辰": "沙中土", "丁巳": "沙中土", "戊午": "天上火", "己未": "天上火",
  "庚申": "石榴木", "辛酉": "石榴木", "壬戌": "大海水", "癸亥": "大海水",
};

export function getNayin(stem: string, branch: string): string {
  return NAYIN_TABLE[stem + branch] || "";
}
