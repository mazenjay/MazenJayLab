import type { ArticleOverview, SearchHit } from "./types";
import { ARTICLES_PAGE_SIZE } from "./constants";

export const mockArticles: ArticleOverview[] = [
  {
    id: 1,
    title: "Building the Digital Glass Lab",
    summary:
      "Exploring the intersection of Glassmorphism and modern web performance. How we built this site.",
    tags: ["design", "frontend"],
    date: "2026-03-01",
    slug: "building-the-digital-glass-lab",
    kind: "开发技术",
    kind_label: "开发技术",
  },
  {
    id: 2,
    title: "Go vs Rust: A Microservice Benchmark",
    summary:
      "Running 1 million requests per second. Which language holds up better under pressure?",
    tags: ["backend", "benchmark"],
    date: "2026-03-02",
    slug: "go-vs-rust-microservice-benchmark",
    kind: "开发技术",
    kind_label: "开发技术",
  },
  {
    id: 3,
    title: "The Art of Minimalist Interfaces",
    summary:
      "Why less is more is harder than it looks. A practical view on hierarchy and visual rhythm.",
    tags: ["ui", "product"],
    date: "2026-03-03",
    slug: "the-art-of-minimalist-interfaces",
    kind: "学习笔记",
    kind_label: "学习笔记",
  },
  {
    id: 4,
    title: "Midnight Debugging Session",
    summary:
      "Sometimes the cleanest fixes appear at 3 AM after removing one unnecessary abstraction.",
    tags: ["life", "engineering"],
    date: "2026-03-04",
    slug: "midnight-debugging-session",
    kind: "生活分享",
    kind_label: "生活分享",
  },
  {
    id: 5,
    title: "Understanding GORM Hooks",
    summary:
      "How to keep persistence clean with before/after hooks and predictable side effects.",
    tags: ["golang", "database"],
    date: "2026-03-05",
    slug: "understanding-gorm-hooks",
    kind: "学习笔记",
    kind_label: "学习笔记",
  },
];

/** 无 BACKEND_URL 时 /api/articles 与 Spotlight 搜索回退用的少量假数据 */
export function paginateArticles(page: number, perPage: number) {
  const p = Math.max(1, page || 1);
  const pp = Math.max(1, perPage || ARTICLES_PAGE_SIZE);
  const start = (p - 1) * pp;
  const end = start + pp;
  const records = mockArticles.slice(start, end);
  return {
    total: mockArticles.length,
    records,
    has_more: end < mockArticles.length,
  };
}

/** 模拟后端：在首处匹配外包 <mark>（与真实 API 返回格式一致） */
function wrapSearchMark(text: string, kw: string): string {
  if (!kw.trim()) return text;
  const lower = text.toLowerCase();
  const k = kw.toLowerCase();
  const idx = lower.indexOf(k);
  if (idx < 0) return text;
  return (
    text.slice(0, idx) +
    "<mark>" +
    text.slice(idx, idx + k.length) +
    "</mark>" +
    text.slice(idx + k.length)
  );
}

/** 与 Go ParseDateKeyword 语义对齐的本地过滤（UTC 日界） */
function mockArticleMatchesDateKeyword(articleDate: string, kw: string): boolean {
  const m = /^(gt|gte|lt|lte|eq):(\d{4}-\d{2}-\d{2})$/i.exec(kw.trim());
  if (!m) return false;
  const op = m[1].toLowerCase();
  const ymd = m[2];
  const dayStart = new Date(`${ymd}T00:00:00.000Z`).getTime();
  const nextDay = new Date(`${ymd}T00:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextStart = nextDay.getTime();
  const t = new Date(`${articleDate}T12:00:00.000Z`).getTime();
  if (Number.isNaN(t)) return false;
  switch (op) {
    case "eq":
      return t >= dayStart && t < nextStart;
    case "gt":
      return t >= nextStart;
    case "gte":
      return t >= dayStart;
    case "lt":
      return t < dayStart;
    case "lte":
      return t < nextStart;
    default:
      return false;
  }
}

export function searchMock(
  keywords: string,
  command: string,
  page: number,
  perPage: number,
) {
  const cmd = (command || "").toLowerCase().trim();
  const kwRaw = (keywords || "").trim();
  const kw = kwRaw.toLowerCase();

  let hits: SearchHit[] = mockArticles.map((a) => ({
    type: "article",
    id: a.id,
    title: a.title,
    summary: a.summary,
    icon: "/statics/images/article.png",
    link: a.slug,
  }));

  if (cmd === "tags") {
    const want = kwRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (want.length === 0) {
      hits = [];
    } else {
      hits = hits.filter((h) => {
        const art = mockArticles.find((a) => a.id === h.id);
        if (!art) return false;
        return want.every((t) =>
          art.tags.some((tag) => tag.toLowerCase() === t),
        );
      });
    }
  } else if (cmd === "title") {
    if (!kwRaw) {
      hits = [];
    } else {
      hits = hits
        .filter((h) => h.title.toLowerCase().includes(kw))
        .map((h) => ({
          ...h,
          title: wrapSearchMark(h.title, kwRaw),
        }));
    }
  } else if (cmd === "date") {
    if (!kwRaw) {
      hits = [];
    } else {
      hits = hits.filter((h) => {
        const art = mockArticles.find((a) => a.id === h.id);
        if (!art) return false;
        return mockArticleMatchesDateKeyword(art.date, kwRaw);
      });
    }
  } else if (cmd === "type" || cmd === "category" || cmd === "kind") {
    if (!kwRaw.trim()) {
      hits = [];
    } else {
      const needle = kwRaw.trim().toLowerCase();
      hits = hits.filter((h) => {
        const art = mockArticles.find((a) => a.id === h.id);
        if (!art) return false;
        const k = art.kind.toLowerCase();
        return k === needle || k.includes(needle);
      });
    }
  } else if (kw) {
    hits = hits
      .filter((h) =>
        `${h.title} ${h.summary}`.toLowerCase().includes(kw),
      )
      .map((h) => ({
        ...h,
        title: wrapSearchMark(h.title, kwRaw),
        summary: wrapSearchMark(h.summary, kwRaw),
      }));
  }

  const p = Math.max(1, page || 1);
  const pp = Math.max(1, perPage || 10);
  const start = (p - 1) * pp;
  const end = start + pp;

  return {
    total: hits.length,
    records: hits.slice(start, end),
  };
}
