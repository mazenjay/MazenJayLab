"use client";

import { Disc3, ListMusic, Radio } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLabReveal } from "./useLabReveal";

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

export function MusicRoleSection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  useLabReveal(ref, reduceMotion);

  return (
    <section
      ref={ref}
      id="lab-role-music"
      className="relative z-20 flex min-h-[100dvh] scroll-mt-0 flex-col justify-center bg-gradient-to-b from-indigo-950 via-[#120a1f] to-slate-950 text-white"
      aria-labelledby="lab-music-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(99 102 241 / 0.5), transparent 50%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 py-10 md:px-10 md:py-12">
        {/* 与上两屏不同：横向「演出」布局 + 黑胶 + playlist 旁白 */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          <div className="flex justify-center lg:w-[380px] lg:shrink-0">
            <Reveal className="w-full max-w-[300px] md:max-w-[320px]">
              <div className="relative aspect-square w-full">
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-600/20 blur-2xl"
                  aria-hidden
                />
                <div className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-white/15 bg-black/40 shadow-2xl ring-1 ring-white/10">
                  <div className="absolute inset-4 rounded-full border border-white/10 bg-gradient-to-br from-zinc-800 to-black" />
                  <Disc3
                    className="relative z-10 h-28 w-28 text-violet-300/90 md:h-32 md:w-32"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                  <div className="absolute z-10 h-4 w-4 rounded-full bg-zinc-900 ring-2 ring-violet-400/50" />
                </div>
              </div>
            </Reveal>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 md:items-start">
              <Reveal>
                <div className="rotate-[-1deg] rounded-xl border border-white/20 bg-white/5 p-7 backdrop-blur-sm md:p-8">
                  <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-violet-200/90">
                    我是什么？
                  </p>
                  <h2
                    id="lab-music-heading"
                    className="text-3xl font-black uppercase leading-none tracking-tighter md:text-5xl"
                  >
                    音乐爱好者
                  </h2>
                  <p className="mt-3 text-sm text-violet-200/80">
                    耳机 · 现场 · 同一周里三种genre
                  </p>
                </div>
              </Reveal>

              <Reveal>
                <div className="rounded-xl border border-dashed border-white/25 bg-black/25 p-5 md:mt-6 md:p-6">
                  <div className="mb-4 flex items-center gap-2 text-violet-200/90">
                    <Radio className="h-4 w-4" aria-hidden />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em]">
                      角色周边
                    </span>
                  </div>
                  <ul className="space-y-2 font-mono text-[11px] text-white/70">
                    <li className="flex justify-between border-b border-white/10 py-1.5">
                      <span>独立摇滚</span>
                      <span className="text-white/40">常驻</span>
                    </li>
                    <li className="flex justify-between border-b border-white/10 py-1.5">
                      <span>电子 / 氛围</span>
                      <span className="text-white/40">写代码用</span>
                    </li>
                    <li className="flex justify-between py-1.5">
                      <span>古典 / 原声</span>
                      <span className="text-white/40">重置用</span>
                    </li>
                  </ul>
                </div>
              </Reveal>
            </div>

            <Reveal>
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.07] to-transparent p-7 md:p-9">
                <ListMusic
                  className="pointer-events-none absolute -right-4 -bottom-4 h-32 w-32 text-white/[0.04]"
                  aria-hidden
                />
                <p className="relative text-base font-medium leading-relaxed text-slate-200 md:text-lg">
                  耳朵像第二个键盘：节奏会改我写代码时的 pace，音色会改情绪底色。现场和耳机是两种 debug
                  模式——一个要身体在场，一个允许走神和联想。歌单即日记；以后这块可以换成最近在听的专辑封面墙。
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
