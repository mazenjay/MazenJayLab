"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** 在 scope 内为所有 `[data-lab-reveal]` 绑定 scrub 浮现动画 */
export function useLabReveal(
  scopeRef: RefObject<HTMLElement | null>,
  reduceMotion?: boolean | null,
) {
  useGSAP(
    () => {
      if (reduceMotion) return;
      const root = scopeRef.current;
      if (!root) return;

      const nodes = root.querySelectorAll<HTMLElement>("[data-lab-reveal]");
      nodes.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 48, opacity: 0.08, filter: "blur(10px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            ease: "none",
            scrollTrigger: {
              trigger: el,
              /* min-h-screen + 垂直居中时，元素进屏后 top 常在视口中部，旧版 end: top 48% 会直接判定已播完 */
              start: "top bottom",
              end: "top 62%",
              scrub: 0.85,
              invalidateOnRefresh: true,
            },
          },
        );
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
    },
    { scope: scopeRef, dependencies: [reduceMotion] },
  );
}
