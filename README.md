# 观真

专属六爻体系网站第一期。当前版本先做可真实使用的六爻排盘工作台，并预留 Supabase 登录、云端历史、DeepSeek 解读与本地资料库索引。

## 已完成

- 两种起卦方式：三钱法、直接排卦
- 问题、占事类型、称谓、起卦时间输入
- 本卦、变卦、卦宫、世应、六亲、六神、纳甲
- 年月日时干支、旬空
- 月令旺衰、月破、日冲、暗动
- 动爻化象：发动、回头生、回头克、同气变、伏吟变
- 六冲、六合、反吟、伏吟结构提示
- 未配置 Supabase 时，本地档案保存到浏览器 localStorage
- 配置 Supabase 后，邮箱验证码登录，用户只能查看和删除自己的历史记录
- DeepSeek API 解读接口；未配置 key 时自动回退到本地规则解读
- Supabase/Postgres schema 与 seed
- 本地资料库索引脚本，支持 PDF、DOCX、TXT、MD 抽取切块

## 推荐部署架构

- Next.js App Router：页面与 API 路由
- Supabase Auth：邮箱验证码登录
- Supabase Postgres：卦例、解读、追问、规则库
- Supabase Storage 或 Cloudflare R2：后期保存原始资料文件
- pgvector：后期资料库向量检索
- DeepSeek：第一阶段 AI 解读模型

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

必填项：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`

没有这些变量也能本地排盘，只是登录、云端历史、DeepSeek 与资料入库不会启用。

## 数据库

在 Supabase SQL editor 里依次执行：

```sql
-- db/schema.sql
-- db/seed.sql
```

`divinations`、`ai_readings`、`followups` 开启了 RLS。用户只能读取、插入、删除自己的记录；删除后记录不可恢复。

## 资料库索引

默认扫描 `/Users/xiaoyuan/Desktop/六爻`：

```bash
PATH="/Users/xiaoyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/xiaoyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:$PATH" \
  /Users/xiaoyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm ingest:docs
```

如果配置了 Supabase service role，脚本会写入 `documents` 和 `document_chunks`；否则会导出到 `output/document-chunks.jsonl`。

## 本地开发

```bash
PATH="/Users/xiaoyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" \
  /Users/xiaoyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm dev
```

## 验证

```bash
PATH="/Users/xiaoyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" \
  /Users/xiaoyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm test

PATH="/Users/xiaoyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" \
  /Users/xiaoyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm build
```
