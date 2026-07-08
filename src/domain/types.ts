export type YinYang = "yin" | "yang";
export type Gender = "male" | "female" | "unknown";
export type CalendarType = "solar" | "lunar";
export type YaoMethod = "coins" | "direct";
export type YaoValue = 6 | 7 | 8 | 9;
export type Topic = "general" | "career" | "wealth" | "love" | "health" | "lost" | "study" | "lawsuit";

export type TrigramName = "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";
export type FiveElement = "木" | "火" | "土" | "金" | "水";
export type SixRelation = "兄弟" | "子孙" | "妻财" | "官鬼" | "父母";
export type SixSpirit = "青龙" | "朱雀" | "勾陈" | "螣蛇" | "白虎" | "玄武";

export interface HexagramRecord {
  key: string;
  name: string;
  upper: TrigramName;
  lower: TrigramName;
  palace: TrigramName;
  palaceElement: FiveElement;
  stage: "本宫" | "一世" | "二世" | "三世" | "四世" | "五世" | "游魂" | "归魂";
  shiLine: number;
  yingLine: number;
}

export interface GanZhi {
  gan: string;
  zhi: string;
  text: string;
}

export interface LiuyaoInput {
  name: string;
  question: string;
  topic: Topic;
  gender: Gender;
  calendarType: CalendarType;
  method: YaoMethod;
  date: string;
  hour: number;
  minute: number;
  lineValues: YaoValue[];
}

export interface YaoLine {
  position: number;
  value: YaoValue;
  yinYang: YinYang;
  moving: boolean;
  changedYinYang: YinYang;
  hidden: boolean;
  sixSpirit: SixSpirit;
  sixRelation: SixRelation;
  ganZhi: GanZhi;
  element: FiveElement;
  monthState: "旺" | "相" | "休" | "囚" | "死";
  twelveStage: "长生" | "沐浴" | "冠带" | "临官" | "帝旺" | "衰" | "病" | "死" | "墓" | "绝" | "胎" | "养";
  isMonthBroken: boolean;
  isDayClash: boolean;
  isDarkMoving: boolean;
  transformLabels: string[];
  isShi: boolean;
  isYing: boolean;
  hiddenSpirit?: {
    sixRelation: SixRelation;
    ganZhi: GanZhi;
    element: FiveElement;
    monthState: YaoLine["monthState"];
    twelveStage: YaoLine["twelveStage"];
    flyRelation: "伏生飞" | "飞生伏" | "伏克飞" | "飞克伏" | "伏飞同气";
  };
  shenSha: string[];
}

export interface HexRelation {
  isSixClash: boolean;
  isSixCombine: boolean;
  isFanYin: boolean;
  isFuYin: boolean;
}

export interface RuleSignal {
  title: string;
  level: "good" | "neutral" | "watch";
  body: string;
}

export interface LiuyaoChart {
  input: LiuyaoInput;
  solarDate: string;
  lunarDate: string;
  year: GanZhi;
  month: GanZhi;
  day: GanZhi;
  time: GanZhi;
  monthBranch: string;
  emptyBranches: string[];
  original: HexagramRecord;
  changed: HexagramRecord;
  lines: YaoLine[];
  changedLines: YaoLine[];
  hexRelation: HexRelation;
  ruleSignals: RuleSignal[];
  notes: string[];
}
