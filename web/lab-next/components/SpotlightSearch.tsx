"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchHit } from "@/lib/types";
import { articleHref } from "@/lib/article-link";

const SUPPORTED_DIRECTIVES = ["type", "notes", "category"];

function resolveLink(link: string) {
  if (!link) return "#";
  if (link.startsWith("http")) return link;
  if (link.startsWith("/")) return link;
  return articleHref(link);
}

export function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [directive, setDirective] = useState<string | null>(null);
  const [directiveLabel, setDirectiveLabel] = useState("NOTES");
  const [showQuick, setShowQuick] = useState(true);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingMore = useRef(false);
  const searchPage = useRef(1);
  const keywordRef = useRef("");
  const directiveRef = useRef<string | null>(null);
  const resultsAreaRef = useRef<HTMLDivElement>(null);
  const allHitsRef = useRef<SearchHit[]>([]);

  const resetSpotlightUI = useCallback(() => {
    setShowQuick(true);
    setHits([]);
    allHitsRef.current = [];
    setTotal(0);
    setSelectedIndex(-1);
    setLoading(false);
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

  const fetchSearchResults = useCallback(
    async (isNewSearch: boolean) => {
      if (isLoadingMore.current) return;
      isLoadingMore.current = true;

      if (!isNewSearch && resultsAreaRef.current) {
        const el = document.createElement("div");
        el.id = "load-more-spinner";
        el.className =
          "py-4 text-center text-blue-500 text-xs font-bold flex items-center justify-center gap-2";
        el.innerHTML =
          '<i class="ri-loader-4-line animate-spin-slow"></i> Fetching more...';
        resultsAreaRef.current.appendChild(el);
      }

      const param = new URLSearchParams({
        command: directiveRef.current || "",
        keywords: keywordRef.current,
        page: String(searchPage.current),
        per_page: "10",
      });

      try {
        const response = await fetch(`/api/search?${param.toString()}`);
        const resData = await response.json();
        const t = Number(resData.total ?? 0);
        const batch = (resData.records ?? []) as SearchHit[];

        setTotal(t);
        if (isNewSearch) {
          allHitsRef.current = batch;
          setHits(batch);
          setSelectedIndex(-1);
        } else {
          allHitsRef.current = allHitsRef.current.concat(batch);
          setHits(allHitsRef.current);
          document.getElementById("load-more-spinner")?.remove();
        }
      } catch (e) {
        console.error(e);
        if (isNewSearch) {
          setHits([]);
          allHitsRef.current = [];
        }
      } finally {
        isLoadingMore.current = false;
      }
    },
    [],
  );

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (!directiveRef.current) {
      for (const d of SUPPORTED_DIRECTIVES) {
        const trigger = `${d}:`;
        if (val.toLowerCase().startsWith(trigger)) {
          directiveRef.current = d;
          setDirective(d);
          setDirectiveLabel(d);
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

    setShowQuick(false);
    setLoading(true);
    setHits([]);
    searchTimeout.current = setTimeout(() => {
      searchPage.current = 1;
      fetchSearchResults(true).finally(() => setLoading(false));
    }, 300);
  };

  const applyDirective = (d: string) => {
    setInputValue(`${d}: `);
    directiveRef.current = d;
    setDirective(d);
    setDirectiveLabel(d);
    keywordRef.current = "";
    setShowQuick(false);
    setLoading(true);
    searchPage.current = 1;
    fetchSearchResults(true).finally(() => setLoading(false));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && directiveRef.current) {
      e.preventDefault();
      const d = directiveRef.current;
      setInputValue(`${d}:`);
      directiveRef.current = null;
      setDirective(null);
      keywordRef.current = "";

      if (d) {
        searchPage.current = 1;
        setLoading(true);
        fetchSearchResults(true).finally(() => setLoading(false));
      } else {
        resetSpotlightUI();
      }
      return;
    }

    const items = document.querySelectorAll(".spotlight-result-item");
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = Math.min(prev + 1, items.length - 1);
        items.forEach((el, idx) => {
          el.classList.toggle("bg-blue-100", idx === next);
        });
        if (
          next === items.length - 1 &&
          allHitsRef.current.length < total &&
          !isLoadingMore.current
        ) {
          searchPage.current += 1;
          fetchSearchResults(false);
        }
        items[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        items.forEach((el, idx) => {
          el.classList.toggle("bg-blue-100", idx === next);
        });
        items[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = selectedIndex >= 0 ? selectedIndex : 0;
      const el = items[idx] as HTMLAnchorElement | undefined;
      if (el?.href) {
        window.open(el.href, "_blank");
        closeModal();
      }
    }
  };

  const onScrollResults = () => {
    const area = resultsAreaRef.current;
    if (!area) return;
    if (
      area.scrollTop + area.clientHeight >= area.scrollHeight - 20 &&
      allHitsRef.current.length < total &&
      !isLoadingMore.current
    ) {
      searchPage.current += 1;
      fetchSearchResults(false);
    }
  };

  useEffect(() => {
    (window as unknown as { openSpotlight?: () => void }).openSpotlight =
      openModal;
    return () => {
      delete (window as unknown as { openSpotlight?: () => void }).openSpotlight;
    };
  }, [openModal]);

  if (!open) return null;

  const showMeta = !showQuick && (loading || hits.length > 0 || keywordRef.current);

  return (
    <div
      className={`fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[15vh] transition-opacity duration-200 ${mounted ? "opacity-100" : "opacity-0"}`}
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) closeModal();
      }}
    >
      <div
        className={`w-[600px] max-w-[90vw] bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white transform transition-all duration-200 overflow-hidden flex flex-col max-h-[70vh] ${mounted ? "scale-100" : "scale-95"}`}
      >
        <div
          className="flex items-center px-6 h-16 border-b border-gray-100 shrink-0 cursor-text transition-colors duration-200 focus-within:bg-blue-50/30"
          onClick={() => document.getElementById("searchInput")?.focus()}
        >
          <i className="ri-search-line text-xl text-lab-accent mr-3" />
          <div
            className={`${directive ? "flex" : "hidden"} items-center justify-center px-2 py-1 mr-2 bg-blue-100 text-blue-700 text-xs font-bold rounded-md uppercase tracking-wider border border-blue-200 shrink-0 animate-zoom-in`}
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
            placeholder="Search (e.g., type:project golang)..."
            className="bg-transparent flex-1 text-xl outline-none text-gray-800 placeholder-gray-400 font-light h-full min-w-[50px]"
          />
          <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-1 rounded bg-gray-50 ml-4 shrink-0">
            ESC
          </span>
        </div>

        <div
          ref={resultsAreaRef}
          id="searchResultsArea"
          onScroll={onScrollResults}
          className="p-2 bg-gray-50/50 overflow-y-auto hide-scroll flex-1 relative min-h-[120px]"
        >
          {showQuick && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-2">
                Quick Actions
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => applyDirective("type")}
                  className="spotlight-item flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition group text-left w-full"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 flex items-center justify-center">
                    <i className="ri-terminal-box-line" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                    Filter by Resource Type{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs ml-1 group-hover:bg-blue-200">
                      type:
                    </code>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => applyDirective("notes")}
                  className="spotlight-item flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition group text-left w-full"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 flex items-center justify-center">
                    <i className="ri-sticky-note-line" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                    Search within my Notes{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs ml-1 group-hover:bg-blue-200">
                      notes:
                    </code>
                  </span>
                </button>
              </div>
            </div>
          )}

          {!showQuick && (
            <div className="flex flex-col gap-1 pb-2">
              {loading && (
                <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                  <i className="ri-loader-4-line animate-spin-slow text-2xl mb-2" />
                  Scanning the Lab...
                </div>
              )}
              {!loading && hits.length === 0 && (
                <div className="p-10 text-center flex flex-col items-center text-gray-400">
                  <i className="ri-ghost-line text-4xl mb-3 opacity-50" />
                  <span className="text-sm">No matches found.</span>
                </div>
              )}
              {!loading &&
                hits.map((item, hi) => {
                  const badge =
                    item.type === "project" ? (
                      <span className="text-[9px] font-bold text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded-md uppercase">
                        Project
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-md uppercase">
                        Note
                      </span>
                    );
                  return (
                    <a
                      key={`${item.type}-${item.id}-${hi}`}
                      href={resolveLink(item.link)}
                      target="_blank"
                      rel="noreferrer"
                      className="spotlight-result-item flex flex-col gap-0.5 px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors duration-75 text-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                          {item.icon?.startsWith("http") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.icon}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <i className="ri-file-text-line text-gray-400" />
                          )}
                        </div>
                        <span className="font-semibold text-[14px] text-gray-800 truncate">
                          {item.title}
                        </span>
                        <div className="ml-auto">{badge}</div>
                      </div>
                      <div className="pl-6 text-[12px] text-gray-500 truncate font-normal opacity-80">
                        {item.summary}
                      </div>
                    </a>
                  );
                })}
            </div>
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
            <div className="flex items-center gap-2 opacity-60">
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                ↑
              </span>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                ↓
              </span>
              <span className="text-[10px] text-gray-400 ml-1">
                to navigate
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
