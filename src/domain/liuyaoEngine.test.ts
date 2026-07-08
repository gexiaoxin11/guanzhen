import { describe, expect, it } from "vitest";
import { branchElements, hexagrams, naJia, xunKong } from "./liuyaoData";
import { calculateLiuyao } from "./liuyaoEngine";
import { buildLocalReading } from "./readingRules";
import type { LiuyaoInput, YaoValue } from "./types";

const baseInput: LiuyaoInput = {
  name: "测试",
  question: "测试事项",
  topic: "general",
  gender: "unknown",
  calendarType: "solar",
  method: "direct",
  date: "2026-07-06",
  hour: 17,
  minute: 30,
  lineValues: [7, 7, 7, 7, 7, 7],
};

describe("calculateLiuyao", () => {
  it("keeps core liuyao lookup data complete", () => {
    expect(hexagrams).toHaveLength(64);
    expect(new Set(hexagrams.map((item) => item.key)).size).toBe(64);
    expect(new Set(hexagrams.map((item) => item.name)).size).toBe(64);
    expect(Object.keys(xunKong).sort()).toEqual(["甲午", "甲子", "甲寅", "甲戌", "甲申", "甲辰"].sort());
    for (const trigram of Object.values(naJia)) {
      for (const line of [...trigram.inner, ...trigram.outer]) {
        expect(branchElements[line.slice(1, 2)]).toBeTruthy();
      }
    }
  });

  it("builds a pure qian chart", () => {
    const chart = calculateLiuyao(baseInput);
    expect(chart.original.name).toBe("乾为天");
    expect(chart.original.palace).toBe("乾");
    expect(chart.lines.find((line) => line.isShi)?.position).toBe(6);
    expect(chart.lines.find((line) => line.isYing)?.position).toBe(3);
  });

  it("calculates changed hexagram from moving lines", () => {
    const chart = calculateLiuyao({ ...baseInput, lineValues: [9, 7, 7, 7, 7, 7] });
    expect(chart.changed.name).toBe("天风姤");
    expect(chart.lines[0].changedYinYang).toBe("yin");
    expect(chart.lines[0].moving).toBe(true);
  });

  it("uses named hexagram lists for six clash and six combine", () => {
    const pureQian = calculateLiuyao(baseInput);
    expect(pureQian.hexRelation.isSixClash).toBe(true);
    expect(pureQian.hexRelation.isSixCombine).toBe(false);

    const tai = calculateLiuyao({ ...baseInput, lineValues: [7, 7, 7, 8, 8, 8] });
    expect(tai.original.name).toBe("地天泰");
    expect(tai.hexRelation.isSixClash).toBe(false);
    expect(tai.hexRelation.isSixCombine).toBe(true);

    const jiJi = calculateLiuyao({ ...baseInput, lineValues: [7, 8, 7, 8, 7, 8] });
    expect(jiJi.original.name).toBe("水火既济");
    expect(jiJi.hexRelation.isSixClash).toBe(false);
    expect(jiJi.hexRelation.isSixCombine).toBe(false);
  });

  it("keeps changed-line six relations anchored to the original palace element", () => {
    const chart = calculateLiuyao({ ...baseInput, lineValues: [9, 8, 7, 8, 7, 8] });
    expect(chart.original.name).toBe("水火既济");
    expect(chart.changed.name).toBe("水山蹇");
    expect(chart.original.palaceElement).toBe("水");
    expect(chart.changed.palaceElement).toBe("金");
    expect(chart.changedLines[0].ganZhi.text).toBe("丙辰");
    expect(chart.changedLines[0].sixRelation).toBe("官鬼");
  });

  it("detects day/month combines and harmony groups", () => {
    const chart = calculateLiuyao(baseInput);
    const titles = chart.ruleSignals.map((signal) => signal.title);
    expect(titles).toContain("日合");
    expect(titles).toContain("水三合局");
    expect(titles).toContain("火三合局");

    const monthCombineChart = calculateLiuyao({ ...baseInput, date: "2026-07-07" });
    expect(monthCombineChart.ruleSignals.map((signal) => signal.title)).toContain("月合");
  });

  it("detects fan-yin, fu-yin, progressing and retreating transformations", () => {
    const values = [6, 7, 8, 9] as const;
    const charts = enumerateLineValues(values).map((lineValues) => calculateLiuyao({ ...baseInput, lineValues }));
    expect(calculateLiuyao(baseInput).ruleSignals.map((signal) => signal.title)).toContain("伏吟");
    expect(charts.some((chart) => chart.ruleSignals.some((signal) => signal.title === "反吟"))).toBe(true);
    expect(charts.some((chart) => chart.lines.some((line) => line.transformLabels.includes("进神")))).toBe(true);
    expect(charts.some((chart) => chart.lines.some((line) => line.transformLabels.includes("退神")))).toBe(true);
  });

  it("places missing six-relation hidden spirits under same-position flying spirits", () => {
    const chart = calculateLiuyao({ ...baseInput, lineValues: [7, 8, 7, 8, 7, 8] });
    expect(chart.original.name).toBe("水火既济");

    const hiddenLine = chart.lines.find((line) => line.hiddenSpirit?.sixRelation === "妻财");
    expect(hiddenLine?.position).toBe(3);
    expect(hiddenLine?.sixRelation).toBe("兄弟");
    expect(hiddenLine?.ganZhi.text).toBe("己亥");
    expect(hiddenLine?.hiddenSpirit).toMatchObject({
      sixRelation: "妻财",
      ganZhi: { text: "戊午", zhi: "午" },
      element: "火",
      flyRelation: "飞克伏",
    });
    expect(chart.ruleSignals.find((signal) => signal.title === "伏神")?.body).toContain("妻财戊午伏于3爻兄弟己亥下");

    const reading = buildLocalReading({ chart, question: "财运怎么样？" });
    expect(reading).toContain("伏神飞神：妻财戊午火伏于三爻兄弟己亥水下，飞克伏");
  });

  it("builds weather-specific local reading sections", () => {
    const chart = calculateLiuyao({ ...baseInput, question: "明天天气怎么样？" });
    const reading = buildLocalReading({ chart, question: "明天天气怎么样？" });
    expect(reading.split("\n\n")[0]).toBe("一句话总结");
    expect(reading).not.toContain("气象的走势");
    expect(reading).not.toContain("好嘞");
    expect(reading).toContain("父母爻看雨雪");
    expect(reading).toContain("子孙爻看晴明");
    expect(reading).toContain("官鬼爻看阴霾雷电");
    expect(reading).toContain("兄弟爻看风");
  });

  it("builds general local reading with core dimensions", () => {
    const chart = calculateLiuyao(baseInput);
    const reading = buildLocalReading({ chart, question: "事业能不能推进？" });
    expect(reading.split("\n\n")[0]).toBe("一句话总结");
    expect(reading).not.toContain("茶先放稳");
    expect(reading).not.toContain("好嘞");
    expect(reading).toContain("一句话总结");
    expect(reading).toContain("世应分析");
    expect(reading).toContain("用神分析");
    expect(reading).toContain("可执行建议");
  });

  it("uses topic-specific local reading rules", () => {
    const cases = [
      ["career", "事业", "职位/规则/上级压力"],
      ["wealth", "财运", "钱财/收益/标的"],
      ["love", "感情", "现实吸引/伴侣信号"],
      ["health", "健康", "病症/压力源"],
      ["lost", "失物", "所失之物"],
      ["study", "学业", "学业/成绩/证书资料"],
      ["lawsuit", "官非", "官非压力/规则对抗"],
    ] as const;

    for (const [topic, name, marker] of cases) {
      const chart = calculateLiuyao({ ...baseInput, topic, question: `${name}测试` });
      const reading = buildLocalReading({ chart, question: `${name}测试` });
      expect(reading).toContain(`用神分析：${name}取象`);
      expect(reading).toContain(marker);
    }
  });

  it("adds use-god strength scoring and timing windows to local reading", () => {
    const chart = calculateLiuyao({ ...baseInput, topic: "wealth", question: "财运怎么样？", lineValues: [7, 8, 7, 8, 7, 8] });
    const reading = buildLocalReading({ chart, question: "财运怎么样？" });
    expect(reading).toContain("用神强弱约");
    expect(reading).toContain("应期判断：什么时候更容易动");
    expect(reading).toContain("静卦应期不宜说死");
    expect(reading).toContain("伏神妻财戊午不在明面");
    expect(reading).toContain("午日/午时");

    const movingChart = calculateLiuyao({ ...baseInput, topic: "career", question: "项目何时推进？", lineValues: [9, 7, 7, 7, 7, 7] });
    const movingReading = buildLocalReading({ chart: movingChart, question: "项目何时推进？" });
    expect(movingReading).toContain("盘中有动爻，应期可先看动爻、变爻所临地支。");
    expect(movingReading).toContain("变爻");
  });
});

function enumerateLineValues(values: readonly YaoValue[]) {
  const result: YaoValue[][] = [];
  for (const a of values) {
    for (const b of values) {
      for (const c of values) {
        for (const d of values) {
          for (const e of values) {
            for (const f of values) result.push([a, b, c, d, e, f]);
          }
        }
      }
    }
  }
  return result;
}
