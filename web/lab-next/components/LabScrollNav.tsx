"use client";

import { useCallback } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollToPlugin);
}

export const LAB_SCROLL_SECTIONS = [
  { id: "lab-hero", label: "Lab" },
  { id: "lab-works", label: "Works" },
  { id: "lab-journal", label: "Journal" },
  { id: "lab-contact", label: "Contact" },
] as const;

type LabScrollNavProps = {
  className?: string;
};

export function LabScrollNav({ className }: LabScrollNavProps) {
  const reduceMotion = useReducedMotion();

  const go = useCallback(
    (sectionId: string) => {
      const el = document.getElementById(sectionId);
      if (!el) return;

      if (reduceMotion) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }

      gsap.to(window, {
        duration: 1.05,
        scrollTo: { y: el, offsetY: 8, autoKill: true },
        ease: "power2.inOut",
      });
    },
    [reduceMotion],
  );

  return (
    <nav
      aria-label="页面区块"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-4 md:pt-5",
        className,
      )}
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:gap-2 [&::-webkit-scrollbar]:hidden">
        {LAB_SCROLL_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors",
              "text-white/90 hover:text-cyan-200",
              "[text-shadow:0_1px_2px_rgb(0_0_0/0.85),0_0_20px_rgb(0_0_0/0.35)]",
              "md:px-3 md:text-[11px] md:tracking-[0.28em]",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
