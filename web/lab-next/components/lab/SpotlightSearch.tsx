"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { SearchHit } from "@/lib/types";
import { articleHref } from "@/lib/article-link";
import { LAB_SPOTLIGHT_OPEN_EVENT } from "@/lib/lab-spotlight";
import {
  sanitizeSearchHighlightHtml,
  stripHtmlForAria,
} from "@/lib/search-highlight-html";
import { SEARCH_PER_PAGE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const hitMarkClass =
  "[&_mark]:rounded-sm [&_mark]:bg-amber-200/90 [&_mark]:px-0.5 [&_mark]:text-gray-900 [&_mark]:font-semibold";

/** Longer directive names first so `kind:` does not partially match `title:`. */
const SUPPORTED_DIRECTIVES = [
  "category",
  "title",
  "kind",
  "tags",
  "date",
] as const;

const DIRECTIVE_LABELS: Record<string, string> = {
  category: "CAT",
  title: "TITLE",
  kind: "KIND",
  tags: "TAGS",
  date: "DATE",
};

function mapDirectiveToApiCommand(d: string | null): string {
  return d ?? "";
}

function placeholderForDirective(d: string | null): string {
  switch (d) {
    case "tags":
      return "tag1, tag2 …";
    case "title":
      return "Search in titles only…";
    case "date":
      return "gt:2002-02-01  (also gte, lt, lte, eq)";
    case "kind":
      return "Article kind (exact stored value, e.g. tech)";
    default:
      return "Search… or type kind:, tags:, title:, date:";
  }
}

function resolveLink(link: string) {
  if (!link) return "#";
  if (link.startsWith("http")) return link;
  if (link.startsWith("/")) return link;
  return articleHref(link);
}

/**
 * API `type` is the indexed doc kind (article Kind string) or `project`.
 * Never show a generic "Note" label for all hits.
 */
function SpotlightHitBadge({ rawType }: { rawType: string }) {
  const t = (rawType || "").trim();
  const lower = t.toLowerCase();
  if (lower === "project") {
    return (
      <span className="max-w-[6.5rem] truncate rounded-md bg-orange-100/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-orange-700">
        Project
      </span>
    );
  }
  if (t) {
    const label = t.length > 14 ? `${t.slice(0, 13)}…` : t;
    return (
      <span
        className="max-w-[6.5rem] truncate rounded-md bg-slate-100/95 px-1.5 py-0.5 text-[9px] font-semibold text-slate-800"
        title={t}
      >
        {label}
      </span>
    );
  }
  return (
    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
      Article
    </span>
  );
}

/** Fixed row geometry so viewport height is an exact multiple of rows (no half row). */
const SPOTLIGHT_ROW_GAP_PX = 4;
const SPOTLIGHT_ROW_HEIGHT_PX = 56;
const SPOTLIGHT_VISIBLE_ROWS = 5;
const SPOTLIGHT_ROW_STRIDE = SPOTLIGHT_ROW_HEIGHT_PX + SPOTLIGHT_ROW_GAP_PX;
const SPOTLIGHT_LIST_MAX_HEIGHT_PX =
  SPOTLIGHT_VISIBLE_ROWS * SPOTLIGHT_ROW_HEIGHT_PX +
  (SPOTLIGHT_VISIBLE_ROWS - 1) * SPOTLIGHT_ROW_GAP_PX;

/** Hidden scrollbar; native wheel/trackpad (no custom step). */
const spotlightResultsScrollClass =
  "min-h-0 shrink-0 overflow-x-hidden overflow-y-auto overscroll-contain touch-pan-y " +
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function alignSpotlightScrollToSelected(
  list: HTMLElement,
  selectedIndex: number,
): void {
  if (selectedIndex < 0) return;
  const rowTop = selectedIndex * SPOTLIGHT_ROW_STRIDE;
  const rowBottom = rowTop + SPOTLIGHT_ROW_HEIGHT_PX;
  const viewH = list.clientHeight;
  let st = list.scrollTop;
  if (rowTop < st) st = rowTop;
  else if (rowBottom > st + viewH) st = rowBottom - viewH;
  list.scrollTop = st;
}

export function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [directive, setDirective] = useState<string | null>(null);
  const [directiveLabel, setDirectiveLabel] = useState("KIND");
  const [showQuick, setShowQuick] = useState(true);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keywordRef = useRef("");
  const directiveRef = useRef<string | null>(null);
  const resultsAreaRef = useRef<HTMLDivElement>(null);
  /** Scroll container for hit rows (max ~5 visible). */
  const resultsListScrollRef = useRef<HTMLDivElement>(null);
  /** Keep in sync with selectedIndex so Enter does not use a stale closure. */
  const selectedIndexRef = useRef(-1);
  /** Skip one align pass after PageUp/PageDown (scroll + index updated together). */
  const skipNextAlignScrollRef = useRef(false);

  const resetSpotlightUI = useCallback(() => {
    setShowQuick(true);
    setHits([]);
    setTotal(0);
    setSelectedIndex(-1);
    selectedIndexRef.current = -1;
    setLoading(false);
    setSearchError(null);
  }, []);

  const openModal = useCallback(() => {
    setOpen(true);
    setMounted(false);
    requestAnimationFrame(() => {
      setMounted(true);
      setDirective(null);
      directiveRef.current = null;
      setInputValue("");
      keywordRef.current = "";
      resetSpotlightUI();
      setTimeout(() => {
        document.getElementById("searchInput")?.focus();
      }, 20);
    });
  }, [resetSpotlightUI]);

  const closeModal = useCallback(() => {
    setMounted(false);
    setTimeout(() => setOpen(false), 200);
  }, []);

  /** Lock page scroll so trackpad/wheel targets the modal list, not the document. */
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) closeModal();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) closeModal();
        else openModal();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeModal, openModal]);

  useEffect(() => {
    const onOpen = () => openModal();
    window.addEventListener(LAB_SPOTLIGHT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(LAB_SPOTLIGHT_OPEN_EVENT, onOpen);
  }, [openModal]);

  const fetchSearchResults = useCallback(async () => {
    const param = new URLSearchParams({
      command: mapDirectiveToApiCommand(directiveRef.current),
      keywords: keywordRef.current,
      page: "1",
      per_page: String(SEARCH_PER_PAGE),
    });

    try {
      const response = await fetch(`/api/search?${param.toString()}`);
      const resData = (await response.json()) as {
        total?: number;
        records?: SearchHit[];
        error?: string;
      };
      if (!response.ok) {
        const msg =
          typeof resData.error === "string"
            ? resData.error
            : `Search failed (${response.status})`;
        setSearchError(msg);
        setHits([]);
        setTotal(0);
        return;
      }
      setSearchError(null);
      const t = Number(resData.total ?? 0);
      const raw = (resData.records ?? []) as SearchHit[];
      const batch = raw.slice(0, SEARCH_PER_PAGE);

      setTotal(t);
      setHits(batch);
      setSelectedIndex(-1);
      selectedIndexRef.current = -1;
    } catch (e) {
      console.error(e);
      setSearchError(e instanceof Error ? e.message : "Search failed");
      setHits([]);
    }
  }, []);

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (!directiveRef.current) {
      for (const d of SUPPORTED_DIRECTIVES) {
        const trigger = `${d}:`;
        if (val.toLowerCase().startsWith(trigger)) {
          directiveRef.current = d;
          setDirective(d);
          setDirectiveLabel(DIRECTIVE_LABELS[d] ?? d.toUpperCase());
          const rest = val.slice(trigger.length).trimStart();
          setInputValue(rest);
          val = rest;
          break;
        }
      }
    }

    setInputValue(val);
    keywordRef.current = val.trim();
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!keywordRef.current && !directiveRef.current) {
      resetSpotlightUI();
      return;
    }

    if (!keywordRef.current && directiveRef.current) {
      setShowQuick(false);
      setHits([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setShowQuick(false);
    setLoading(true);
    setHits([]);
    searchTimeout.current = setTimeout(() => {
      fetchSearchResults().finally(() => setLoading(false));
    }, 300);
  };

  const applyDirective = (d: string) => {
    setInputValue("");
    directiveRef.current = d;
    setDirective(d);
    setDirectiveLabel(DIRECTIVE_LABELS[d] ?? d.toUpperCase());
    keywordRef.current = "";
    setShowQuick(false);
    setHits([]);
    setTotal(0);
    setLoading(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && directiveRef.current) {
      e.preventDefault();
      directiveRef.current = null;
      setDirective(null);
      setInputValue("");
      keywordRef.current = "";
      resetSpotlightUI();
      return;
    }

    if (showQuick) return;

    const n = hits.length;
    if (n === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = prev < 0 ? 0 : Math.min(prev + 1, n - 1);
        return next;
      });
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === "PageDown") {
      e.preventDefault();
      const list = resultsListScrollRef.current;
      if (!list) return;
      const cur = selectedIndexRef.current;
      if (cur < 0) {
        skipNextAlignScrollRef.current = true;
        setSelectedIndex(0);
        selectedIndexRef.current = 0;
        return;
      }
      const next = Math.min(cur + 1, n - 1);
      const maxScroll = Math.max(0, list.scrollHeight - list.clientHeight);
      skipNextAlignScrollRef.current = true;
      list.scrollTop = Math.min(maxScroll, list.scrollTop + SPOTLIGHT_ROW_STRIDE);
      setSelectedIndex(next);
      selectedIndexRef.current = next;
      return;
    }

    if (e.key === "PageUp") {
      e.preventDefault();
      const list = resultsListScrollRef.current;
      if (!list) return;
      const cur = selectedIndexRef.current;
      if (cur < 0) {
        skipNextAlignScrollRef.current = true;
        setSelectedIndex(0);
        selectedIndexRef.current = 0;
        return;
      }
      const next = Math.max(cur - 1, 0);
      skipNextAlignScrollRef.current = true;
      list.scrollTop = Math.max(0, list.scrollTop - SPOTLIGHT_ROW_STRIDE);
      setSelectedIndex(next);
      selectedIndexRef.current = next;
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      setSelectedIndex(0);
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      setSelectedIndex(n - 1);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const idx = selectedIndexRef.current >= 0 ? selectedIndexRef.current : 0;
      const item = hits[idx];
      if (!item) return;
      const href = resolveLink(item.link);
      if (href && href !== "#") {
        window.open(href, "_blank");
        closeModal();
      }
    }
  };

  useEffect(() => {
    (window as unknown as { openSpotlight?: () => void }).openSpotlight =
      openModal;
    return () => {
      delete (window as unknown as { openSpotlight?: () => void }).openSpotlight;
    };
  }, [openModal]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    setSelectedIndex((i) => {
      if (hits.length === 0) return -1;
      if (i >= hits.length) return hits.length - 1;
      return i;
    });
  }, [hits.length]);

  useLayoutEffect(() => {
    if (selectedIndex < 0) return;
    if (skipNextAlignScrollRef.current) {
      skipNextAlignScrollRef.current = false;
      return;
    }
    const list = resultsListScrollRef.current;
    if (!list) return;
    alignSpotlightScrollToSelected(list, selectedIndex);
  }, [selectedIndex, hits.length]);

  if (!open) return null;

  const showMeta =
    !showQuick &&
    (loading ||
      hits.length > 0 ||
      !!inputValue.trim() ||
      !!directive ||
      !!searchError);

  return (
    <div
      className={`fixed inset-0 z-[70] overscroll-none bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[15vh] transition-opacity duration-200 ${mounted ? "opacity-100" : "opacity-0"}`}
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) closeModal();
      }}
    >
      <div
        className={`w-[600px] max-w-[90vw] overscroll-contain bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white transform transition-all duration-200 overflow-hidden flex flex-col max-h-[70vh] ${mounted ? "scale-100" : "scale-95"}`}
      >
        <div className="shrink-0 border-b border-gray-100">
          <div
            className="flex h-16 cursor-text items-center px-6 transition-colors duration-200 focus-within:bg-blue-50/30"
            onClick={() => document.getElementById("searchInput")?.focus()}
          >
            <i className="ri-search-line mr-3 text-xl text-lab-accent" />
            <div
              className={cn(
                "mr-2 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-blue-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 animate-zoom-in",
                directive ? "flex" : "hidden",
              )}
            >
              <i className="ri-terminal-box-line mr-1 opacity-70" />
              <span>{directiveLabel}</span>
            </div>
            <input
              id="searchInput"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={inputValue}
              onChange={onInput}
              onKeyDown={onKeyDown}
              aria-activedescendant={
                !showQuick && selectedIndex >= 0
                  ? `spotlight-hit-${selectedIndex}`
                  : undefined
              }
              aria-controls="spotlight-results-listbox"
              aria-autocomplete="list"
              aria-haspopup="listbox"
              placeholder={placeholderForDirective(directive)}
              className="h-full min-w-[50px] flex-1 bg-transparent text-xl font-light text-gray-800 outline-none placeholder:text-gray-400"
            />
            <span className="ml-4 shrink-0 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-400">
              ESC
            </span>
          </div>
          {directive === "date" && (
            <p className="px-6 pb-2 text-[11px] leading-relaxed text-gray-500">
              <span className="font-semibold text-gray-600">Date filter:</span>{" "}
              <code className="rounded bg-gray-100 px-1 text-[10px]">gt:</code>{" "}
              <code className="rounded bg-gray-100 px-1 text-[10px]">gte:</code>{" "}
              <code className="rounded bg-gray-100 px-1 text-[10px]">lt:</code>{" "}
              <code className="rounded bg-gray-100 px-1 text-[10px]">lte:</code>{" "}
              <code className="rounded bg-gray-100 px-1 text-[10px]">eq:</code>
              <span className="text-gray-400">
                {" "}
                + <code className="text-[10px]">YYYY-MM-DD</code> (UTC)
              </span>
            </p>
          )}
          {directive === "tags" && (
            <p className="px-6 pb-2 text-[11px] text-gray-500">
              Comma-separated:{" "}
              <code className="rounded bg-gray-100 px-1 text-[10px]">
                golang, frontend
              </code>{" "}
              — matches documents that have <strong>all</strong> listed tags.
            </p>
          )}
        </div>

        <div
          ref={resultsAreaRef}
          id="searchResultsArea"
          className={cn(
            "relative flex min-h-0 flex-1 flex-col bg-gray-50/50 p-2",
            showQuick ? "overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "overflow-hidden",
          )}
        >
          {showQuick && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-2">
                Quick Actions
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => applyDirective("kind")}
                  className="spotlight-item flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition group text-left w-full"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 flex items-center justify-center">
                    <i className="ri-bookmark-3-line" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                    Filter by article kind{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs ml-1 group-hover:bg-blue-200">
                      kind:
                    </code>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => applyDirective("tags")}
                  className="spotlight-item flex w-full items-center gap-3 rounded-xl p-3 text-left transition group hover:cursor-pointer hover:bg-blue-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm group-hover:border-blue-200 group-hover:text-blue-600">
                    <i className="ri-price-tag-3-line" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                    Filter by tags (comma-separated){" "}
                    <code className="ml-1 rounded bg-gray-200 px-1 text-xs group-hover:bg-blue-200">
                      tags:
                    </code>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => applyDirective("title")}
                  className="spotlight-item flex w-full items-center gap-3 rounded-xl p-3 text-left transition group hover:cursor-pointer hover:bg-blue-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm group-hover:border-blue-200 group-hover:text-blue-600">
                    <i className="ri-heading" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                    Search title only{" "}
                    <code className="ml-1 rounded bg-gray-200 px-1 text-xs group-hover:bg-blue-200">
                      title:
                    </code>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => applyDirective("date")}
                  className="spotlight-item flex w-full items-center gap-3 rounded-xl p-3 text-left transition group hover:cursor-pointer hover:bg-blue-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm group-hover:border-blue-200 group-hover:text-blue-600">
                    <i className="ri-calendar-line" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                    Filter by publish date{" "}
                    <code className="ml-1 rounded bg-gray-200 px-1 text-xs group-hover:bg-blue-200">
                      date:
                    </code>{" "}
                    <span className="text-xs text-gray-500">
                      e.g. gt:2026-01-01
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {!showQuick && (
            <>
              {searchError && (
                <div
                  className="mx-2 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {searchError}
                </div>
              )}
              {loading && (
                <div className="flex flex-col items-center p-8 text-center text-sm text-gray-400">
                  <i className="ri-loader-4-line animate-spin-slow mb-2 text-2xl" />
                  Scanning the Lab...
                </div>
              )}
              {!loading && hits.length === 0 && !searchError && (
                <div className="flex flex-col items-center p-10 text-center text-gray-400">
                  <i className="ri-ghost-line mb-3 text-4xl opacity-50" />
                  <span className="text-sm">No matches found.</span>
                </div>
              )}
              {!loading && hits.length > 0 && (
                <div
                  ref={resultsListScrollRef}
                  id="spotlight-results-scroll"
                  onWheel={(ev) => ev.stopPropagation()}
                  style={{ maxHeight: SPOTLIGHT_LIST_MAX_HEIGHT_PX }}
                  className={spotlightResultsScrollClass}
                >
                  <div
                    id="spotlight-results-listbox"
                    className="flex flex-col pb-0"
                    style={{ gap: SPOTLIGHT_ROW_GAP_PX }}
                    role="listbox"
                    aria-label="Search results"
                  >
                    {hits.map((item, hi) => {
                      const active = hi === selectedIndex;
                      return (
                    <a
                      key={`${item.type}-${item.id}-${hi}`}
                      id={`spotlight-hit-${hi}`}
                      data-spotlight-index={hi}
                      role="option"
                      aria-selected={active}
                      href={resolveLink(item.link)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={stripHtmlForAria(item.title)}
                      onMouseDown={(ev) => ev.preventDefault()}
                      className={cn(
                        "spotlight-result-item mx-1 box-border flex shrink-0 cursor-pointer items-center gap-3 rounded-lg px-3 text-gray-700",
                        active
                          ? "bg-sky-100/90 ring-1 ring-inset ring-sky-400/35"
                          : "bg-transparent",
                      )}
                      style={{ height: SPOTLIGHT_ROW_HEIGHT_PX }}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-100 bg-white">
                        {item.icon?.startsWith("http") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.icon}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <i className="ri-file-text-line text-lg text-gray-400" />
                        )}
                      </div>
                      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-0.5 overflow-hidden">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate font-semibold text-[14px] leading-snug text-gray-800",
                              hitMarkClass,
                            )}
                            dangerouslySetInnerHTML={{
                              __html: sanitizeSearchHighlightHtml(item.title),
                            }}
                          />
                          <div className="shrink-0">
                            <SpotlightHitBadge rawType={item.type} />
                          </div>
                        </div>
                        <div
                          className={cn(
                            "line-clamp-1 text-[12px] leading-snug font-normal text-gray-500 opacity-90",
                            hitMarkClass,
                          )}
                          dangerouslySetInnerHTML={{
                            __html: sanitizeSearchHighlightHtml(item.summary),
                          }}
                        />
                      </div>
                    </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {showMeta && (
          <div className="px-4 py-2 bg-white border-t border-gray-100 shrink-0 flex items-center justify-between">
            <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
              <i className="ri-bar-chart-2-line text-blue-500" />
              <span>
                Found{" "}
                <span className="font-bold text-gray-800">{total}</span> results{" "}
                <span className="text-[10px] ml-1 opacity-70">
                  (showing {hits.length})
                </span>
              </span>
            </div>
            <div className="hidden items-center gap-1.5 opacity-60 sm:flex">
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                ↑↓
              </span>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                PgUp/PgDn
              </span>
              <span className="text-[10px] text-gray-400 ml-0.5">
                scroll
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
