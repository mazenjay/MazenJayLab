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

function coalesceId(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

function normalizeArticleOverview(raw: unknown): ArticleOverview | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const id = coalesceId(a.id ?? a.ID);
  const title = typeof a.title === "string" ? a.title : typeof a.Title === "string" ? a.Title : "";
  const summary = typeof a.summary === "string" ? a.summary : "";
  const slug =
    typeof a.slug === "string" ? a.slug : typeof a.Slug === "string" ? a.Slug : "";
  const date = typeof a.date === "string" ? a.date : "";
  let tags: string[] = [];
  if (Array.isArray(a.tags)) {
    tags = a.tags.filter((t): t is string => typeof t === "string");
  }
  // Back end historically omitted title/summary on Update(); slug may still be set from convert.
  const displayTitle = title.trim() || slug.trim();
  if (!Number.isFinite(id) || !displayTitle || !slug.trim()) return null;
  const kind =
    typeof a.kind === "string"
      ? a.kind.trim()
      : typeof a.Kind === "string"
        ? a.Kind.trim()
        : "";
  const kindLabel =
    typeof a.kind_label === "string"
      ? a.kind_label.trim()
      : typeof a.kindLabel === "string"
        ? a.kindLabel.trim()
        : "";
  const kind_label = kindLabel || kind;
  return { id, title: displayTitle, summary, tags, date, slug, kind, kind_label };
}
