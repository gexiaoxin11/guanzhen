import fs from "node:fs";
import path from "node:path";

type ChunkRecord = {
  document: { source_path: string; title: string };
  chunk: { chunk_index: number; content: string };
};

let chunksCache: ChunkRecord[] | null = null;

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

// Extract keywords from user question
function extractKeywords(question: string): string[] {
  // Remove common words, keep meaningful Chinese characters
  const cleaned = question.replace(/[？?！!，,。.\s]+/g, "");
  const keywords: string[] = [];
  
  // Bigram extraction for Chinese text
  for (let i = 0; i < cleaned.length - 1; i++) {
    keywords.push(cleaned.slice(i, i + 2));
  }
  // Also add single characters for broader matching
  for (const ch of cleaned) {
    keywords.push(ch);
  }
  
  // Add topic-related expansion
  const topicMap: Record<string, string[]> = {
    "事业": ["官鬼", "父母", "求职", "升职", "工作"],
    "财运": ["妻财", "子孙", "兄弟", "投资", "生意"],
    "感情": ["官鬼", "妻财", "应爻", "桃花", "婚姻"],
    "健康": ["官鬼", "子孙", "医药", "疾病"],
    "失物": ["妻财", "子孙", "丢失", "寻找"],
    "学业": ["父母", "官鬼", "考试", "文昌"],
    "官司": ["官鬼", "兄弟", "诉讼", "官司"],
  };
  
  for (const [topic, words] of Object.entries(topicMap)) {
    if (question.includes(topic)) {
      keywords.push(...words);
    }
  }
  
  return [...new Set(keywords)];
}

export function searchDocuments(question: string, maxResults = 5): Array<{ title: string; content: string; score: number }> {
  const chunks = loadChunks();
  if (!chunks.length) return [];
  
  const keywords = extractKeywords(question);
  
  const scored = chunks.map((record) => {
    let score = 0;
    const content = record.chunk.content;
    for (const kw of keywords) {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const matches = content.match(regex);
      if (matches) score += matches.length;
    }
    // Bonus for title match
    if (record.document.title.includes(question.slice(0, 4))) {
      score += 5;
    }
    return { ...record, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  // Deduplicate by content similarity and take top results
  const seen = new Set<string>();
  const results: Array<{ title: string; content: string; score: number }> = [];
  
  for (const item of scored) {
    if (item.score === 0) continue;
    const key = item.chunk.content.slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      title: item.document.title,
      content: item.chunk.content.slice(0, 300), // limit context length
      score: item.score,
    });
    if (results.length >= maxResults) break;
  }
  
  return results;
}

// Refresh cache (call after re-ingesting)
export function refreshDocumentCache() {
  chunksCache = null;
  loadChunks();
}
