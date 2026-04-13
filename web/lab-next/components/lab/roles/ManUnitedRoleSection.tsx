"use client";

import Image from "next/image";
import { Award, Goal, Shirt } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ManUnitedShieldWatermark } from "./ManUnitedShieldWatermark";
import { useLabReveal } from "./useLabReveal";

/** Unsplash 占位，可换球星 / 奖杯实拍 */
const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    alt: "足球场与足球",
    wrapClass: "relative col-span-2 row-span-2 min-h-[200px] md:min-h-[260px]",
  },
  {
    src: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=80",
    alt: "体育场看台与灯光",
    wrapClass: "relative min-h-[100px] md:min-h-[120px]",
  },
  {
    src: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&q=80",
    alt: "球鞋与草地",
    wrapClass: "relative min-h-[100px] md:min-h-[120px]",
  },
  {
    src: "https://images.unsplash.com/photo-1522778119026-d163f3666096?w=600&q=80",
    alt: "球迷与围巾氛围",
    wrapClass: "relative col-span-2 min-h-[120px] md:min-h-[140px]",
  },
] as const;

function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-lab-reveal className={cn("will-change-[transform,opacity,filter]", className)}>
      {children}
    </div>
  );
}

const HONOUR_CHIPS = [
  { icon: Award, text: "国内双冠 · 纪念" },
  { icon: Goal, text: "逆转基因" },
  { icon: Shirt, text: "7号与传承" },
] as const;

export function ManUnitedRoleSection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  useLabReveal(ref, reduceMotion);

  return (
    <section
      ref={ref}
      id="lab-role-united"
      className="relative z-20 flex min-h-[100dvh] scroll-mt-0 flex-col justify-center bg-slate-50 text-slate-900"
      aria-labelledby="lab-united-heading"
    >
      <div className="relative mx-auto w-full max-w-7xl px-5 py-10 md:px-10 md:py-12">
        <div className="flex flex-col gap-6 lg:flex-row-reverse lg:items-center lg:gap-10">
          <div className="flex flex-1 flex-col gap-3.5 lg:max-w-xl">
            <Reveal>
              {/* 身份落在卡片上：红金球星卡，不承担整屏背景 */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/90 bg-gradient-to-b from-[#ff2a33] via-[#b30d18] to-[#4a0408] p-[3px] shadow-[0_20px_50px_-12px_rgba(185,28,28,0.45)] ring-1 ring-red-950/25">
                <div
                  className="pointer-events-none absolute right-3 top-3 w-11 opacity-30 md:w-12"
                  aria-hidden
                >
                  <ManUnitedShieldWatermark className="h-auto w-full" />
                </div>
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-white/25 via-transparent to-transparent opacity-40"
                  aria-hidden
                />
                <div className="relative rounded-[13px] bg-gradient-to-b from-[#ff3b44]/95 to-[#9a0b16]/98 px-7 py-8 md:px-9 md:py-9">
                  <div
                    className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl"
                    aria-hidden
                  />
                  <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-amber-200/95">
                    我是什么？
                  </p>
                  <h2
                    id="lab-united-heading"
                    className="text-3xl font-black uppercase tracking-tighter text-white drop-shadow md:text-5xl"
                  >
                    曼联球迷
                  </h2>
                  <p className="mt-3 text-sm font-semibold text-amber-100/95">
                    Red Devils · 周末重置键
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="rounded-2xl border border-red-100 bg-white p-7 shadow-sm ring-1 ring-slate-200/80 md:p-9">
                <p className="text-base font-medium leading-relaxed text-slate-600 md:text-lg md:leading-relaxed">
                  青训、逆转、老特拉福德的声浪——看球像给大脑做热身。漫长赛季里的耐心，和迭代一版版产品时的倔劲，意外是同一种节奏。球星海报与夺冠瞬间，只是书桌旁的软提醒：高峰是稀缺的，日常训练才是真的。
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="rounded-2xl border border-red-100/90 bg-red-50/40 p-5 shadow-sm md:p-6">
                <p className="mb-3 font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-red-800/70">
                  周边 · 可换成你的收藏
                </p>
                <div className="flex flex-wrap gap-2">
                  {HONOUR_CHIPS.map(({ icon: Icon, text }) => (
                    <span
                      key={text}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-950 shadow-sm"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-red-600" aria-hidden />
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="flex-1">
            <div className="grid grid-cols-2 gap-2.5 md:gap-3">
              {GALLERY.map((item) => (
                <div
                  key={item.src}
                  className={cn(
                    "overflow-hidden rounded-2xl bg-slate-200 shadow-md ring-2 ring-red-100/90",
                    item.wrapClass,
                  )}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
