"use client";

import React, { forwardRef, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** 与 app/page.tsx 中 diveTl 的时间一致，便于把「杂志句」 stagger 接到同一时间轴上 */
const CHROME_OUT = 0.56;
const MAG_IN = CHROME_OUT + 0.16 + 0.14;
const MAG_SHOW_END = MAG_IN + 0.36;
const MAG_FADE_START = MAG_IN + 1.0;

const INTRO_LINES = [
  "Mazen Jay Lab® 是一间独立数字工作室。",
  "栈上常用 Go、Swift 与 TypeScript，在工具、界面与系统之间往返。",
  "我们相信好软件是克制的：接口清晰，错误少见，动效有目的。",
  "这里有的不是营销尾页，而是 Works、Journal 与持续生长的实验记录。",
] as const;

type HeroMagazineIntroProps = {
  className?: string;
};

/**
 * Jesko 式大字号陈述 + 滚动 scrub：上行先亮，下行从半透明逐步「洗」成实白（与 lab-scene-a-hero 同步）。
 */
export const HeroMagazineIntro = forwardRef<HTMLDivElement, HeroMagazineIntroProps>(
  function HeroMagazineIntro({ className }, ref) {
    const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
    const footerRef = useRef<HTMLDivElement | null>(null);

    useGSAP(
      () => {
        const lines = INTRO_LINES.map((_, i) => lineRefs.current[i]).filter(Boolean) as HTMLParagraphElement[];
        if (!lines.length) return;

        const dim = 0.3;
        gsap.set(lines, { opacity: dim });
        if (footerRef.current) gsap.set(footerRef.current, { opacity: dim });

        const apply = () => {
          const st = ScrollTrigger.getById("lab-scene-a-hero");
          const tl = st?.animation as gsap.core.Timeline | undefined;
          const total = tl?.duration() ?? 2.35;
          const t = tl ? tl.time() : (st?.progress ?? 0) * total;

          if (t < MAG_IN) {
            gsap.set(lines, { opacity: dim });
            if (footerRef.current) gsap.set(footerRef.current, { opacity: dim });
            return;
          }

          const n = lines.length;
          const revealSpan = Math.max(0.08, (MAG_FADE_START - MAG_SHOW_END) / Math.max(1, n + 1));
          const stagger = (MAG_FADE_START - MAG_SHOW_END - revealSpan * 0.35) / Math.max(1, n);

          lines.forEach((el, i) => {
            const start = MAG_SHOW_END + i * stagger;
            const end = start + revealSpan;
            let o = gsap.utils.clamp(dim, 1, gsap.utils.mapRange(start, end, dim, 1, t));
            if (t >= MAG_FADE_START) {
              o *= gsap.utils.clamp(0, 1, gsap.utils.mapRange(MAG_FADE_START, MAG_FADE_START + 0.42, 1, 0, t));
              o = Math.max(o, dim * 0.85);
            }
            gsap.set(el, { opacity: o });
          });

          if (footerRef.current) {
            let fo = gsap.utils.clamp(dim, 1, gsap.utils.mapRange(MAG_SHOW_END + n * stagger, MAG_FADE_START, dim, 1, t));
            if (t >= MAG_FADE_START) {
              fo *= gsap.utils.clamp(0, 1, gsap.utils.mapRange(MAG_FADE_START, MAG_FADE_START + 0.42, 1, 0.65, t));
            }
            gsap.set(footerRef.current, { opacity: fo });
          }
        };

        const aux = ScrollTrigger.create({
          trigger: "#lab-hero",
          start: "top top",
          end: "+=228%",
          scrub: 0.5,
          onUpdate: apply,
        });

        apply();

        return () => {
          aux.kill();
        };
      },
      [],
    );

    const setRootRef = (el: HTMLDivElement | null) => {
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    };

    return (
      <div
        ref={setRootRef}
        className={cn(
          "pointer-events-none invisible absolute inset-0 z-20 flex min-h-full w-full transform-gpu flex-col justify-center overflow-hidden opacity-0 px-5 py-10 backface-hidden sm:px-8 sm:py-12 md:px-12 md:py-14 lg:px-16",
          "[font-family:var(--font-sans),var(--font-lab-sans),ui-sans-serif,system-ui,sans-serif]",
          /* 与 page 中 gsap.set(magazine, { autoAlpha: 0 }) 一致，避免 JS 运行前首屏闪字 */
          className,
        )}
      >
        <div className="flex w-full min-w-0 flex-col gap-10 sm:gap-12 md:gap-14">
          <div className="select-none space-y-[0.08em] md:space-y-[0.06em]">
            {INTRO_LINES.map((line, i) => (
              <p
                key={i}
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                className={cn(
                  "w-full min-w-0 text-pretty text-[clamp(1.5rem,5.5vw,4.25rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-white antialiased sm:text-[clamp(1.65rem,5.8vw,4.75rem)] md:leading-[1.05] md:tracking-[-0.045em] lg:text-[clamp(1.85rem,6vw,5.15rem)]",
                )}
              >
                {line}
              </p>
            ))}
          </div>

          <div
            ref={footerRef}
            className="flex w-full min-w-0 flex-col gap-5 border-l border-white/25 pl-5 sm:pl-6 md:gap-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/55 md:text-xs">Direct access</p>
            <p className="text-sm font-medium leading-relaxed text-white/90 md:text-base">
              继续向下滚动 — Works、Journal，最后接上联系与收束。同一缕深蓝里，场景不断开。
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-[0.35em] text-white/45 md:text-[11px]">
              <span>Scroll</span>
              <span className="text-white/30">Your freedom to build well</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
