"use client";

import { useCallback } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Mail, Search } from "lucide-react";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import { LAB_SPOTLIGHT_OPEN_EVENT } from "@/lib/lab-spotlight";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollToPlugin);
}

const LAB_EMAIL = "mazhj180@gmail.com";
const LAB_GITHUB_HREF =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/mazenjay";

/** 中间区块顺序：Hero → Journal → 角色组合并为一项 About（锚到第一个 role section） */
const LAB_NAV_ANCHORS = [
  { id: "lab-hero", label: "Home" },
  { id: "lab-journal", label: "Journal" },
  { id: "lab-role-developer", label: "Me" },
] as const;

/** 固定导航条占位，避免 Lenis scrollTo 目标被挡 */
const NAV_SCROLL_OFFSET = -56;

type LabScrollNavProps = {
  className?: string;
};

export function LabScrollNav({ className }: LabScrollNavProps) {
  const reduceMotion = useReducedMotion();
  const lenis = useLenis();

  const go = useCallback(
    (sectionId: string) => {
      const el = document.getElementById(sectionId);
      if (!el) return;

      if (reduceMotion) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }

      if (lenis) {
        lenis.scrollTo(el, {
          offset: NAV_SCROLL_OFFSET,
          duration: 1.05,
          easing: (t) =>
            t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
        });
        return;
      }

      gsap.to(window, {
        duration: 1.05,
        scrollTo: { y: el, offsetY: -NAV_SCROLL_OFFSET, autoKill: true },
        ease: "power2.inOut",
      });
    },
    [lenis, reduceMotion],
  );

  const openSearch = useCallback(() => {
    window.dispatchEvent(new Event(LAB_SPOTLIGHT_OPEN_EVENT));
  }, []);

  return (
    <nav
      aria-label="站点导航"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 pt-3 md:pt-4",
        className,
      )}
    >
      <div className="pointer-events-auto mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 md:gap-6">
          <button
            type="button"
            onClick={() => go("lab-hero")}
            className="shrink-0 text-left font-sans text-sm font-semibold tracking-tight text-slate-900 transition-colors hover:text-sky-700 md:text-base"
          >
            MJ LAB
          </button>

          <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
            {LAB_NAV_ANCHORS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                className={cn(
                  "shrink-0 rounded-md px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition-colors",
                  "text-slate-600 hover:text-sky-700",
                  "md:px-2.5 md:text-[11px] md:tracking-[0.22em]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <button
            type="button"
            onClick={openSearch}
            aria-label="打开搜索（⌘K 或 Ctrl+K）"
            className="text-slate-600 transition-colors hover:text-sky-700"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
          </button>

          <div className="flex items-center gap-3.5">
            <a
              href={`mailto:${LAB_EMAIL}`}
              aria-label="邮件联系"
              className="text-slate-600 transition-colors hover:text-sky-700"
            >
              <Mail className="h-[18px] w-[18px]" aria-hidden />
            </a>
            <a
              href={LAB_GITHUB_HREF}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-slate-600 transition-colors hover:text-sky-700"
            >
              <i className="ri-github-fill text-lg leading-none" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
