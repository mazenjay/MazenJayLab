"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextFlippingBoard } from "@/components/ui/text-flipping-board";

const HERO_MESSAGES: string[] = [
  "MAZEN JAY LAB\nBUILD · WRITE · SHIP",
  "Interfaces,\nexperiments,\nlong-form notes.",
  "Scroll down for\nthe Lab Journal.",
  "Ideas worth\ntesting in public.",
];

/** 滚动结束后晚一点再恢复动画，避开 Lenis 惯性末尾 */
const SCROLL_IDLE_MS = 200;

export function LabHeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [msgIdx, setMsgIdx] = useState(0);
  /** Hero 是否仍在视口内（完全滚出则不再轮播、不再跑翻牌动画） */
  const [heroVisible, setHeroVisible] = useState(true);
  /** 正在滚动时冻结翻牌动画，保留格子样式，避免与 Lenis 抢主线程 */
  const [scrollDriving, setScrollDriving] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpScrollBusy = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setScrollDriving(true);
    idleTimer.current = setTimeout(() => {
      setScrollDriving(false);
      idleTimer.current = null;
    }, SCROLL_IDLE_MS);
  }, []);

  useEffect(() => {
    const onScroll = () => bumpScrollBusy();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [bumpScrollBusy]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([e]) => {
      setHeroVisible(e.isIntersecting);
    }, { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const next = useCallback(
    () => setMsgIdx((i) => (i + 1) % HERO_MESSAGES.length),
    [],
  );

  useEffect(() => {
    if (!heroVisible || scrollDriving) return;
    const id = window.setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next, heroVisible, scrollDriving]);

  const animationsPaused = scrollDriving || !heroVisible;

  return (
    <section
      ref={sectionRef}
      id="lab-hero"
      className="relative z-10 flex min-h-screen w-full scroll-mt-0 flex-col items-center justify-center bg-slate-50 px-4 pt-24 pb-16"
    >
      <div className="flex w-full max-w-4xl flex-col items-center gap-10 contain-[layout]">
        <TextFlippingBoard
          text={HERO_MESSAGES[msgIdx]}
          animationsPaused={animationsPaused}
          className="max-w-none shadow-2xl"
        />
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500 md:text-xs">
          Smooth scroll · split-flap hero
        </p>
      </div>
    </section>
  );
}
