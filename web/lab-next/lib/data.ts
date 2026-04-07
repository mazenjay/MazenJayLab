import type { ArticleOverview, ArticlesPagePayload, Project } from "./types";
import { ARTICLES_PAGE_SIZE } from "./constants";
import { mockProjects, paginateArticles } from "./mock-data";

function backendBase(): string | null {
  const u = process.env.BACKEND_URL?.replace(/\/$/, "");
  return u || null;
}

export type HomeData = {
  articles: ArticleOverview[];
  hasMore: boolean;
  totalPages: number;
  totalArticles: number;
  projects: Project[];
};

function computeTotalPages(total: number): number {
  const pageSize = ARTICLES_PAGE_SIZE;
  let pages = Math.floor(total / pageSize);
  if (pages * pageSize < total) pages += 1;
  return Math.max(1, pages);
}

export async function loadHomeData(): Promise<HomeData> {
  const base = backendBase();
  const localPage = paginateArticles(1, ARTICLES_PAGE_SIZE);
  const fallback: HomeData = {
    articles: localPage.records,
    hasMore: localPage.has_more,
    totalPages: computeTotalPages(localPage.total),
    totalArticles: localPage.total,
    projects: mockProjects,
  };

  if (!base) {
    return fallback;
  }

  try {
    const res = await fetch(`${base}/api/articles?page=1`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return fallback;

    const data = (await res.json()) as ArticlesPagePayload;
    const records = (data.records ?? []) as ArticleOverview[];
    const total = Number(data.total ?? 0);

    return {
      articles: records,
      hasMore: Boolean(data.has_more),
      totalPages: computeTotalPages(total),
      totalArticles: total,
      projects: mockProjects,
    };
  } catch {
    return fallback;
  }
}
