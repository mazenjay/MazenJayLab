import type { ArticleOverview, ArticlesPagePayload } from "@/lib/types";

/** 将 Go / 本地 mock 等来源统一成前端使用的分页结构 */
export function normalizeArticlesPayload(raw: unknown): ArticlesPagePayload {
  if (!raw || typeof raw !== "object") {
    return { total: 0, records: [], has_more: false };
  }
  const o = raw as Record<string, unknown>;
  const rawRecords = o.records;
  const records: ArticleOverview[] = Array.isArray(rawRecords)
    ? rawRecords.map(normalizeArticleOverview).filter(Boolean) as ArticleOverview[]
    : [];

  return {
    total: typeof o.total === "number" ? o.total : Number(o.total) || 0,
    records,
    has_more: Boolean(o.has_more),
  };
}

function normalizeArticleOverview(raw: unknown): ArticleOverview | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const id = typeof a.id === "number" ? a.id : Number(a.id);
  const title = typeof a.title === "string" ? a.title : "";
  const summary = typeof a.summary === "string" ? a.summary : "";
  const slug = typeof a.slug === "string" ? a.slug : "";
  const date = typeof a.date === "string" ? a.date : "";
  let tags: string[] = [];
  if (Array.isArray(a.tags)) {
    tags = a.tags.filter((t): t is string => typeof t === "string");
  }
  if (!Number.isFinite(id) || !title || !slug) return null;
  return { id, title, summary, tags, date, slug };
}
