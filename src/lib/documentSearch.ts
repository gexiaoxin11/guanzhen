import fs from "node:fs";
import path from "node:path";

type ChunkRecord = {
  document: { source_path: string; title: string };
  chunk: { chunk_index: number; content: string };
};

let chunksCache: ChunkRecord[] | null = null;
let idfCache: Map<string, number> | null = null;
let docVectorsCache: Map<number, Map<string, number>> | null = null;

function loadChunks(): ChunkRecord[] {
  if (chunksCache) return chunksCache;
  const filePath = path.resolve(process.cwd(), "output/document-chunks.jsonl");
  if (!fs.existsSync(filePath)) {
    chunksCache = [];
    return chunksCache;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  chunksCache = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ChunkRecord);
  return chunksCache;
}

// ─── Chinese text tokenization ───
function tokenize(text: string): string[] {
  const cleaned = text.replace(/[^\u4e00-\u9fff\w]/g, "");
  const tokens: string[] = [];
  
  // Single characters
  for (const ch of cleaned) {
    tokens.push(ch);
  }
  
  // Bigrams (work well for Chinese text)
  for (let i = 0; i < cleaned.length - 1; i++) {
    tokens.push(cleaned.slice(i, i + 2));
  }
  
  // Trigrams for longer phrases
  for (let i = 0; i < cleaned.length - 2; i++) {
    tokens.push(cleaned.slice(i, i + 3));
  }
  
  return tokens;
}

// ─── Stop words ───
const STOP_WORDS = new Set([
  "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一",
  "一个", "这", "也", "之", "与", "及", "以", "而", "等", "或", "但",
  "很", "要", "会", "能", "可以", "没有", "吗", "呢", "吧", "啊",
  "什么", "怎么", "为什么", "哪个", "如何",
]);

function filterStopWords(tokens: string[]): string[] {
  return tokens.filter(t => !STOP_WORDS.has(t));
}

// ─── TF-IDF computation ───
function buildIdf(): { idf: Map<string, number>; docVectors: Map<number, Map<string, number>> } {
  if (idfCache && docVectorsCache) return { idf: idfCache, docVectors: docVectorsCache };

  const chunks = loadChunks();
  const N = chunks.length;
  const df = new Map<string, number>(); // document frequency
  const docVectors = new Map<number, Map<string, number>>();

  for (let i = 0; i < N; i++) {
    const tokens = filterStopWords(tokenize(chunks[i].chunk.content));
    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
    // Normalize TF by max frequency
    const maxFreq = Math.max(...tf.values());
    const normTf = new Map<string, number>();
    for (const [t, f] of tf) {
      normTf.set(t, f / maxFreq);
      df.set(t, (df.get(t) || 0) + 1);
    }
    docVectors.set(i, normTf);
  }

  // IDF = log(N / df)
  const idf = new Map<string, number>();
  for (const [term, freq] of df) {
    idf.set(term, Math.log(N / (freq + 1)) + 1);
  }

  idfCache = idf;
  docVectorsCache = docVectors;
  return { idf, docVectors };
}

// Compute TF-IDF vector for a query
function queryVector(query: string, idf: Map<string, number>): Map<string, number> {
  const tokens = filterStopWords(tokenize(query));
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  const maxFreq = Math.max(...tf.values(), 1);
  const vec = new Map<string, number>();
  for (const [t, f] of tf) {
    const idfVal = idf.get(t) || 0;
    vec.set(t, (f / maxFreq) * idfVal);
  }
  return vec;
}

// Cosine similarity
function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0;
  for (const [term, weight] of a) {
    const bw = b.get(term) || 0;
    dot += weight * bw;
    normA += weight * weight;
  }
  for (const [, weight] of b) {
    normB += weight * weight;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Topic expansion ───
const TOPIC_EXPANSION: Record<string, { keywords: string[]; weight: number }> = {
  "事业": { keywords: ["官鬼", "父母", "求职", "升职", "工作", "官职", "功名"], weight: 2.0 },
  "财运": { keywords: ["妻财", "子孙", "兄弟", "投资", "生意", "钱财", "财富"], weight: 2.0 },
  "感情": { keywords: ["官鬼", "妻财", "应爻", "桃花", "婚姻", "婚嫁", "夫妻"], weight: 2.0 },
  "健康": { keywords: ["官鬼", "子孙", "医药", "疾病", "病者", "安康"], weight: 2.0 },
  "失物": { keywords: ["妻财", "子孙", "丢失", "寻找", "失物", "丢失"], weight: 2.0 },
  "学业": { keywords: ["父母", "官鬼", "考试", "文昌", "文书", "科举"], weight: 2.0 },
  "官司": { keywords: ["官鬼", "兄弟", "诉讼", "官非", "刑伤"], weight: 2.0 },
  "六爻": { keywords: ["六爻", "纳甲", "摇卦", "用神", "世爻", "应爻", "动爻", "伏神", "月建", "日辰"], weight: 2.5 },
  "八字": { keywords: ["八字", "四柱", "日主", "用神", "喜神", "忌神", "大运", "流年", "格局"], weight: 2.5 },
  "紫微": { keywords: ["紫微", "命宫", "三方四正", "四化", "大限", "星曜", "宫位"], weight: 2.5 },
  "奇门": { keywords: ["奇门", "八门", "九星", "八神", "值符", "值使", "格局"], weight: 2.5 },
  "六壬": { keywords: ["六壬", "天乙", "螣蛇", "朱雀", "六合", "勾陈", "青龙", "天空", "白虎", "太常", "玄武", "太阴", "天后"], weight: 2.5 },
  "梅花": { keywords: ["梅花", "体用", "互卦", "变卦", "外应", "卦象"], weight: 2.5 },
  "小六壬": { keywords: ["小六壬", "大安", "留连", "速喜", "赤口", "小吉", "空亡", "三宫"], weight: 2.5 },
};

// Detect mentions and add weighted keywords
function expandQueryByMentions(question: string, idf: Map<string, number>): Map<string, number> {
  const vec = queryVector(question, idf);
  
  for (const [topic, { keywords, weight }] of Object.entries(TOPIC_EXPANSION)) {
    if (question.includes(topic) || question.includes(`@${topic}`)) {
      for (const kw of keywords) {
        const idfVal = idf.get(kw) || 1.5;
        vec.set(kw, (vec.get(kw) || 0) + weight * idfVal * 0.3);
      }
    }
  }
  
  return vec;
}

// ─── Main search API ───
export function searchDocuments(
  question: string,
  maxResults = 8,
  minScore = 0.05,
): Array<{ title: string; content: string; score: number }> {
  const chunks = loadChunks();
  if (!chunks.length) return [];

  const { idf, docVectors } = buildIdf();
  const qVec = expandQueryByMentions(question, idf);

  const scored = chunks.map((record, idx) => {
    const dv = docVectors.get(idx);
    if (!dv) return { ...record, score: 0 };
    const score = cosineSimilarity(qVec, dv);
    
    // Title bonus
    let bonus = 0;
    const cleanedQ = question.replace(/[？?！!，,。.\s]+/g, "");
    if (record.document.title.includes(cleanedQ.slice(0, 4))) {
      bonus += 0.2;
    }
    
    return { ...record, score: score + bonus };
  });

  scored.sort((a, b) => b.score - a.score);

  // Deduplicate
  const seen = new Set<string>();
  const results: Array<{ title: string; content: string; score: number }> = [];

  for (const item of scored) {
    if (item.score < minScore) continue;
    const key = item.chunk.content.slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      title: item.document.title,
      content: item.chunk.content.slice(0, 400),
      score: Math.round(item.score * 100) / 100,
    });
    if (results.length >= maxResults) break;
  }

  return results;
}

// Refresh cache
export function refreshDocumentCache() {
  chunksCache = null;
  idfCache = null;
  docVectorsCache = null;
  loadChunks();
  buildIdf();
}
