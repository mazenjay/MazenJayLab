"use client";

import React, { forwardRef, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { articleHref } from "@/lib/article-link";
import { normalizeArticlesPayload } from "@/lib/articles-payload";
import type { ArticleOverview } from "@/lib/types";
import { cn } from "@/lib/utils";

/** 与 Go `api/handlers.go` ArticlePagination 中 pageSize 一致 */
const PAGE_SIZE = 7;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function formatListDate(raw: string): string {
  if (!raw?.trim()) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    const short = raw.slice(0, 10);
    return short || "—";
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const LabJournalSection = forwardRef<HTMLElement, { className?: string }>(
  function LabJournalSection({ className }, ref) {
    const reduceMotion = useReducedMotion();
    const brisk = reduceMotion ? { duration: 0.01 } : { duration: 0.34, ease: EASE_OUT };

    const [page, setPage] = useState(1);
    const [slideDir, setSlideDir] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [articles, setArticles] = useState<ArticleOverview[]>([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    /** 仅在请求成功后递增，驱动 AnimatePresence 进出层，避免请求途中 key 与数据不一致 */
    const [listKey, setListKey] = useState(0);

    const listAnchorRef = useRef<HTMLDivElement>(null);
    const skipScrollRef = useRef(true);

    useEffect(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      (async () => {
        try {
          const res = await fetch(`/api/articles?page=${page}`, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = normalizeArticlesPayload(await res.json());
          if (!cancelled) {
            setArticles(data.records);
            setTotal(data.total);
            setHasMore(data.has_more);
            setListKey((k) => k + 1);
          }
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "加载失败");
            setArticles([]);
            setTotal(0);
            setHasMore(false);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [page]);

    useEffect(() => {
      if (skipScrollRef.current) {
        skipScrollRef.current = false;
        return;
      }
      listAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [page]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const showPager = !error && total > 0 && totalPages > 1;

    const goPrev = () => {
      setSlideDir(-1);
      setPage((p) => Math.max(1, p - 1));
    };

    const goNext = () => {
      setSlideDir(1);
      setPage((p) => p + 1);
    };

    const slideX = reduceMotion ? 0 : 32 * slideDir;

    return (
      <section
        ref={ref}
        id="lab-journal"
        className={cn(
          "relative z-20 min-h-screen scroll-mt-0 border-t border-white/40 bg-white text-slate-900 shadow-[0_-28px_80px_rgba(15,23,42,0.12)]",
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-sky-100/40 to-transparent" aria-hidden />

        <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-32 md:gap-32 md:px-24 lg:flex-row">
          <div className="lg:w-1/3">
            <div className="sticky top-32">
              <p className="mb-4 font-mono text-sm font-bold uppercase tracking-widest text-sky-600/90">
                Scene III · 浮出水面
              </p>
              <h2 className="mb-8 text-6xl font-black uppercase leading-[0.85] tracking-tighter md:text-8xl">
                Lab
                <br />
                Journal
              </h2>
              <p className="border-l-4 border-slate-900 pl-6 text-lg font-medium leading-relaxed text-slate-600">
                Articles and dissections — like pages pulled from the water into daylight.
              </p>
            </div>
          </div>

          <div ref={listAnchorRef} className="flex flex-col pt-8 lg:w-2/3">
            {loading && articles.length === 0 && (
              <p className="py-12 font-mono text-sm font-bold uppercase tracking-widest text-slate-400">
                Loading articles…
              </p>
            )}
            {error && (
              <p className="py-12 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {!error && !loading && articles.length === 0 && (
              <p className="py-12 text-slate-500">暂无文章。</p>
            )}

            {articles.length > 0 && !error && (
              <div
                className={cn(
                  "relative min-h-[4rem] overflow-hidden",
                  loading && "pointer-events-none",
                )}
              >
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={listKey}
                    initial={reduceMotion ? false : { opacity: 0, x: slideX }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -slideX * 0.75 }}
                    transition={brisk}
                    className="flex flex-col"
                  >
                    {articles.map((article, i) => {
                      const href = articleHref(article.slug);
                      const external = href.startsWith("http");
                      const stagger = reduceMotion ? 0 : 0.038 * i;
                      return (
                        <motion.a
                          key={`${listKey}-${article.id}`}
                          href={href}
                          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                          animate={{ opacity: loading ? 0.55 : 1, y: 0 }}
                          transition={{
                            duration: reduceMotion ? 0.01 : 0.32,
                            delay: stagger,
                            ease: EASE_OUT,
                          }}
                          className={cn(
                            "group flex flex-col justify-between gap-6 border-b-2 border-slate-100 py-12 transition-colors duration-300 hover:border-slate-900 md:flex-row md:items-center",
                          )}
                        >
                          <h3 className="max-w-xl text-3xl font-extrabold tracking-tight text-slate-400 transition-colors duration-300 group-hover:text-slate-900 md:text-4xl">
                            {article.title}
                          </h3>
                          <span className="shrink-0 font-mono text-sm font-bold tracking-widest text-slate-400 transition-colors group-hover:text-slate-900">
                            {formatListDate(article.date)}
                          </span>
                        </motion.a>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
                {loading && articles.length > 0 && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 flex items-start justify-end pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-sky-600/90">
                      Loading…
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {showPager && (
              <nav
                className="mt-4 flex flex-col gap-6 border-t-2 border-slate-100 pt-10 sm:flex-row sm:items-center sm:justify-between"
                aria-label="文章分页"
              >
                <motion.button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={goPrev}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  className={cn(
                    "inline-flex w-full items-center justify-center border-2 border-slate-200 bg-white px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 transition-all sm:w-auto",
                    "hover:border-slate-900 hover:text-slate-900",
                    "disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 disabled:hover:border-slate-100 disabled:hover:text-slate-300",
                  )}
                >
                  ← Prev
                </motion.button>

                <motion.p
                  key={page}
                  initial={reduceMotion ? false : { opacity: 0.4, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={brisk}
                  className="order-first text-center font-mono text-xs font-bold tabular-nums tracking-widest text-slate-500 sm:order-none"
                >
                  <span className="text-slate-900">{String(page).padStart(2, "0")}</span>
                  <span className="mx-2 text-slate-300">/</span>
                  <span>{String(totalPages).padStart(2, "0")}</span>
                  <span className="ml-4 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:inline">
                    {total} entries
                  </span>
                </motion.p>

                <motion.button
                  type="button"
                  disabled={!hasMore || loading}
                  onClick={goNext}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  className={cn(
                    "inline-flex w-full items-center justify-center border-2 border-slate-200 bg-white px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 transition-all sm:w-auto",
                    "hover:border-slate-900 hover:text-slate-900",
                    "disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 disabled:hover:border-slate-100 disabled:hover:text-slate-300",
                  )}
                >
                  Next →
                </motion.button>
              </nav>
            )}
          </div>
        </div>
      </section>
    );
  },
);
