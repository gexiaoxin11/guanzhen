import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { createClient } from "@supabase/supabase-js";

const rootDir = process.env.DOCUMENT_SOURCE_DIR || "/Users/xiaoyuan/Desktop/六爻";
const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../output");
const outputFile = path.join(outputDir, "document-chunks.jsonl");
const supported = new Set([".txt", ".md", ".pdf", ".docx"]);
const chunkSize = 1200;
const overlap = 160;

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const files = await walk(rootDir);
  const records = [];
  const supabase = createSupabase();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!supported.has(ext)) continue;
    try {
      const bytes = await fs.readFile(file);
      const text = normalizeText(await extractText(file, bytes));
      if (!text) continue;
      const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
      const chunks = splitChunks(text).map((content, index) => ({
        chunk_index: index,
        content,
        token_estimate: estimateTokens(content),
        metadata: { source_path: file },
      }));
      const doc = {
        source_path: file,
        title: titleFromPath(file),
        file_type: ext.slice(1),
        sha256,
        byte_size: bytes.byteLength,
        extracted_chars: text.length,
        is_public: false,
      };
      records.push({ document: doc, chunks });
      if (supabase) await upsertDocument(supabase, doc, chunks);
      console.log(`indexed ${path.basename(file)} (${chunks.length} chunks)`);
    } catch (error) {
      console.warn(`skip ${file}: ${error.message}`);
    }
  }

  if (!supabase) {
    const jsonl = records.flatMap(({ document, chunks }) =>
      chunks.map((chunk) => JSON.stringify({ document, chunk })),
    ).join("\n");
    await fs.writeFile(outputFile, jsonl ? `${jsonl}\n` : "");
    console.log(`wrote ${outputFile}`);
  }
  console.log(`done: ${records.length} documents`);
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

async function extractText(file, bytes) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".txt" || ext === ".md") return bytes.toString("utf8");
  if (ext === ".docx") return (await mammoth.extractRawText({ buffer: bytes })).value;
  if (ext === ".pdf") return (await pdfParse(bytes)).text;
  return "";
}

function splitChunks(text) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    const end = Math.min(text.length, index + chunkSize);
    chunks.push(text.slice(index, end).trim());
    if (end === text.length) break;
    index = Math.max(0, end - overlap);
  }
  return chunks.filter(Boolean);
}

function normalizeText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function estimateTokens(text) {
  return Math.ceil(text.length / 1.7);
}

function titleFromPath(file) {
  return path.basename(file, path.extname(file)).replace(/\s+/g, " ").trim();
}

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function upsertDocument(supabase, document, chunks) {
  const { data, error } = await supabase
    .from("documents")
    .upsert(document, { onConflict: "source_path" })
    .select("id")
    .single();
  if (error) throw error;
  await supabase.from("document_chunks").delete().eq("document_id", data.id);
  if (chunks.length === 0) return;
  const { error: chunkError } = await supabase.from("document_chunks").insert(
    chunks.map((chunk) => ({ ...chunk, document_id: data.id })),
  );
  if (chunkError) throw chunkError;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
