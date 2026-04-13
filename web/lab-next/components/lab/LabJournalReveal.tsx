"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type LabJournalRevealProps = {
  children: ReactNode;
};

/** Scroll-driven “float down from above” reveal for the journal block. */
export function LabJournalReveal({ children }: LabJournalRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = rootRef.current;
      if (!el) return;

      gsap.fromTo(
        el,
        {
          yPercent: -10,
          opacity: 0.12,
          filter: "blur(8px)",
        },
        {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "top 58%",
            scrub: 0.75,
            invalidateOnRefresh: true,
          },
        },
      );

      requestAnimationFrame(() => {
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="relative will-change-[transform,opacity,filter]"
    >
      {children}
    </div>
  );
}
