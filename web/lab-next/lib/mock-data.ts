import type { ArticleOverview, Project, SearchHit } from "./types";

export const mockArticles: ArticleOverview[] = [
  {
    id: 1,
    title: "Building the Digital Glass Lab",
    summary:
      "Exploring the intersection of Glassmorphism and modern web performance. How we built this site.",
    tags: ["design", "frontend"],
    date: "2026-03-01",
    slug: "building-the-digital-glass-lab",
  },
  {
    id: 2,
    title: "Go vs Rust: A Microservice Benchmark",
    summary:
      "Running 1 million requests per second. Which language holds up better under pressure?",
    tags: ["backend", "benchmark"],
    date: "2026-03-02",
    slug: "go-vs-rust-microservice-benchmark",
  },
  {
    id: 3,
    title: "The Art of Minimalist Interfaces",
    summary:
      "Why less is more is harder than it looks. A practical view on hierarchy and visual rhythm.",
    tags: ["ui", "product"],
    date: "2026-03-03",
    slug: "the-art-of-minimalist-interfaces",
  },
  {
    id: 4,
    title: "Midnight Debugging Session",
    summary:
      "Sometimes the cleanest fixes appear at 3 AM after removing one unnecessary abstraction.",
    tags: ["life", "engineering"],
    date: "2026-03-04",
    slug: "midnight-debugging-session",
  },
  {
    id: 5,
    title: "Understanding GORM Hooks",
    summary:
      "How to keep persistence clean with before/after hooks and predictable side effects.",
    tags: ["golang", "database"],
    date: "2026-03-05",
    slug: "understanding-gorm-hooks",
  },
  {
    id: 6,
    title: "Search Index Rebuild Strategy",
    summary:
      "Incremental indexing vs full rebuild: trade-offs and fallback plans for real systems.",
    tags: ["search", "infra"],
    date: "2026-03-06",
    slug: "search-index-rebuild-strategy",
  },
  {
    id: 7,
    title: "SSR and Streaming in Next.js",
    summary:
      "A practical template for SSR-first pages with client islands and smooth progressive loading.",
    tags: ["nextjs", "ssr"],
    date: "2026-03-07",
    slug: "ssr-and-streaming-in-nextjs",
  },
  {
    id: 8,
    title: "Designing Better Empty States",
    summary:
      "Empty states are product moments. Here's how to make them useful and emotionally clear.",
    tags: ["ux", "copywriting"],
    date: "2026-03-08",
    slug: "designing-better-empty-states",
  },
  {
    id: 9,
    title: "Event Loop Deep Dive",
    summary:
      "Microtasks, macrotasks, and how async scheduling impacts perceived UI performance.",
    tags: ["javascript", "runtime"],
    date: "2026-03-09",
    slug: "event-loop-deep-dive",
  },
];

export const mockProjects: Project[] = [
  {
    title: "Nebula OS",
    subtitle: "System Architecture",
    summary: "A conceptual browser-native operating system powered by WebAssembly.",
    icon: "ri-planet-line",
    theme_color: "purple",
    status: "Live",
    repo_url: "https://github.com",
    launch_url: "https://example.com",
    techs: [
      { name: "Go", icon: "ri-code-box-line" },
      { name: "WASM", icon: "ri-cpu-line" },
    ],
  },
  {
    title: "Prisma Editor",
    subtitle: "Productivity",
    summary: "An AI-first coding editor with context-aware assistance and fast indexing.",
    icon: "ri-code-s-slash-line",
    theme_color: "blue",
    status: "Beta",
    repo_url: "https://github.com",
    launch_url: "https://example.com",
    techs: [
      { name: "Next.js", icon: "ri-reactjs-line" },
      { name: "TypeScript", icon: "ri-terminal-box-line" },
    ],
  },
];

export function paginateArticles(page: number, perPage: number) {
  const p = Math.max(1, page || 1);
  const pp = Math.max(1, perPage || 7);
  const start = (p - 1) * pp;
  const end = start + pp;
  const records = mockArticles.slice(start, end);
  return {
    total: mockArticles.length,
    records,
    has_more: end < mockArticles.length,
  };
}

export function searchMock(
  keywords: string,
  command: string,
  page: number,
  perPage: number,
) {
  const kw = (keywords || "").toLowerCase().trim();
  let hits: SearchHit[] = mockArticles.map((a) => ({
    type: "article",
    id: a.id,
    title: a.title,
    summary: a.summary,
    icon: "/statics/images/article.png",
    link: a.slug,
  }));

  if (command === "project" || command === "type:project") {
    hits = [];
  }

  if (kw) {
    hits = hits.filter((h) =>
      `${h.title} ${h.summary}`.toLowerCase().includes(kw),
    );
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
