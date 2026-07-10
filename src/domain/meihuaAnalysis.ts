import type { MeihuaOutput } from "taibu-core/meihua";

const GUA_NATURE: Record<string, string> = {
  乾为天: "刚健进取", 坤为地: "柔顺包容", 水雷屯: "初创艰难", 山水蒙: "蒙昧待启",
  水天需: "等待时机", 天水讼: "争讼是非", 地水师: "统兵出征", 水地比: "亲附和合",
};

export function analyzeMeihua(result: MeihuaOutput) {
  const main = result.mainHexagram;
  const changed = result.changedHexagram;
  const nuclear = result.nuclearHexagram;
  const bodyTri = result.bodyTrigram;
  const useTri = result.useTrigram;
  const relation = result.bodyUseRelation;
  const judgment = result.judgement;
  const interactions = result.interactionReadings;
  const timings = result.timingHints;
  const seasonal = result.seasonalState;

  // 本卦解读
  const mainNature = GUA_NATURE[main?.name || ""] || `${main?.name || "—"}卦`;

  // 体用关系
  const tiyongDetail = {
    "体生用": "体卦生用卦，泄气之象。主耗费精力，付出多回报少，宜主动付出不急于求成。",
    "用生体": "用卦生体卦，生扶之象。主得外力相助，事半功倍，人缘佳时机有利。",
    "体克用": "体卦克用卦，克胜之象。主能掌控局面，事可成但需费力，宜坚持主见。",
    "用克体": "用卦克体卦，受克之象。主外力压制，事多阻碍，宜以守为攻等待时机。",
    "比和": "体用比和，和谐之象。主顺利顺遂，人事物皆顺，宜顺水推舟。",
  }[relation.relation] || relation.summary;

  // 阶段解读
  const stageLabels: Record<string, string> = {
    use: "用卦阶段", body_mutual: "体互阶段", use_mutual: "用互阶段", changed: "变卦阶段",
  };

  // 应期
  const timingPhases: Record<string, string> = {
    early: "近期", middle: "中期", late: "远期",
  };

  return {
    mainName: main?.name || "—",
    mainNature,
    mainGuaCi: main?.guaCi,
    mainXiangCi: main?.xiangCi,
    changedName: changed?.name,
    nuclearName: nuclear?.name,
    bodyTrigram: { name: bodyTri.name, element: bodyTri.element },
    useTrigram: { name: useTri.name, element: useTri.element },
    relation: relation.relation,
    relationFavorable: relation.favorable,
    tiyongDetail,
    stages: interactions.map((s: any) => ({
      label: stageLabels[s.stage] || s.stage,
      relation: s.relation,
      favorable: s.favorable,
      summary: s.summary,
    })),
    timings: timings.map((t: any) => ({
      phase: timingPhases[t.phase] || t.phase,
      trigger: t.trigger,
      summary: t.summary,
    })),
    seasonal,
    outcome: judgment.outcome,
    summary: judgment.summary,
    basis: judgment.basis,
    movingLine: result.movingLine,
  };
}
