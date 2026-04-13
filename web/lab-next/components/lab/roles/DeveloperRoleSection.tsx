// "use client";

// import { Binary, Braces, Terminal } from "lucide-react";
// import { useReducedMotion } from "motion/react";
// import { useRef, type ReactNode } from "react";
// import { cn } from "@/lib/utils";
// import { useLabReveal } from "./useLabReveal";

// function Reveal({
//   children,
//   className,
// }: {
//   children: ReactNode;
//   className?: string;
// }) {
//   return (
//     <div data-lab-reveal className={cn("will-change-[transform,opacity,filter]", className)}>
//       {children}
//     </div>
//   );
// }

// export function DeveloperRoleSection() {
//   const ref = useRef<HTMLElement>(null);
//   const reduceMotion = useReducedMotion();
//   useLabReveal(ref, reduceMotion);

//   return (
//     <section
//       ref={ref}
//       id="lab-role-developer"
//       className="relative z-20 flex min-h-[100dvh] scroll-mt-0 flex-col justify-center bg-[#f4f6f8]"
//       aria-labelledby="lab-dev-heading"
//     >
//       <div
//         className="pointer-events-none absolute inset-0 opacity-[0.35]"
//         style={{
//           backgroundImage:
//             "linear-gradient(rgb(148 163 184 / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(148 163 184 / 0.07) 1px, transparent 1px)",
//           backgroundSize: "48px 48px",
//         }}
//         aria-hidden
//       />
//       <div className="relative mx-auto w-full max-w-7xl px-5 py-10 md:px-10 md:py-12">
//         <div className="grid gap-5 lg:grid-cols-12 lg:gap-8 lg:items-center">
//           {/* 左：错层叠卡 */}
//           <div className="flex flex-col gap-3.5 lg:col-span-5">
//             <Reveal className="lg:ml-0">
//               <div className="rounded-2xl border-2 border-slate-900 bg-white p-8 shadow-[8px_8px_0_0_rgb(15_23_42)] md:p-10">
//                 <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-sky-600">
//                   我是什么？
//                 </p>
//                 <h2
//                   id="lab-dev-heading"
//                   className="text-3xl font-black uppercase leading-none tracking-tighter text-slate-900 md:text-5xl"
//                 >
//                   Developer
//                 </h2>
//                 <p className="mt-4 text-sm font-medium text-slate-500 md:text-base">
//                   写代码的人 · 也写工具和文档
//                 </p>
//               </div>
//             </Reveal>
//             <Reveal className="lg:ml-8">
//               <div className="rounded-2xl border border-slate-200 bg-white/95 p-7 md:p-9">
//                 <p className="text-base font-medium leading-relaxed text-slate-600 md:text-lg md:leading-relaxed">
//                   全栈与 CLI 都碰，更在乎长期可维护而不是一次性的炫技。用小实验验证想法，把重复的交给自动化；界面和手感的细节，往往比「用了什么新框架」更重要。
//                 </p>
//               </div>
//             </Reveal>
//           </div>

//           {/* 右：控制台 + 能力拼图 */}
//           <div className="flex flex-col gap-3.5 lg:col-span-7">
//             <Reveal>
//               <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-xl">
//                 <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
//                   <Terminal className="h-4 w-4 text-emerald-400" aria-hidden />
//                   <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
//                     dev-environment — zsh
//                   </span>
//                 </div>
//                 <pre className="overflow-x-auto p-6 font-mono text-[11px] leading-relaxed text-emerald-300/95 md:p-7 md:text-xs md:leading-loose">
//                   <code>
//                     {`$ mazen lab doctor
// ✓ go        1.22+
// ✓ node      22
// ✓ docker    ok
// → next dev  :3000  (turbopack)

// # 最近在折腾
// - 日志 / 观测
// - 本地 sqlite 与 pg 切换`}
//                   </code>
//                 </pre>
//               </div>
//             </Reveal>

//             <div className="grid grid-cols-3 gap-2.5 md:gap-3">
//               {[
//                 { icon: Braces, label: "TS / Go", sub: "主力语言" },
//                 { icon: Binary, label: "CLI & API", sub: "顺手的事" },
//                 { icon: Terminal, label: "DX", sub: "能爽就爽" },
//               ].map(({ icon: Icon, label, sub }) => (
//                 <Reveal key={label}>
//                   <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
//                     <Icon className="mb-2.5 h-6 w-6 text-slate-800 md:h-7 md:w-7" aria-hidden />
//                     <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-900">
//                       {label}
//                     </p>
//                     <p className="mt-1 text-[11px] text-slate-500 md:text-xs">{sub}</p>
//                   </div>
//                 </Reveal>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import { Binary, Braces, Terminal, Cpu, GitBranch, Layers } from "lucide-react";
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

export function DeveloperRoleSection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  useLabReveal(ref, reduceMotion);

  return (
    <section
      ref={ref}
      id="lab-role-developer"
      className="relative z-20 flex min-h-[100dvh] scroll-mt-0 flex-col justify-center bg-[#f4f6f8] overflow-hidden"
      aria-labelledby="lab-dev-heading"
    >
      {/* ================= 背景层 1：网格纸效果 ================= */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.3]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(148 163 184 / 0.1) 1px, transparent 1px), linear-gradient(90deg, rgb(148 163 184 / 0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden
      />

      {/* ================= 背景层 2：手写草稿 / 白板代码 ================= */}
      {/* 给这段背景加一个专属 class 'gsap-sketch-bg'，方便你用 GSAP 做视差滚动 */}
      <div 
        className="gsap-sketch-bg pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.06] mix-blend-multiply"
        aria-hidden
      >
        <div 
          className="relative w-full h-full min-w-[1200px]"
          // 使用系统自带的手写字体 fallback，配合一点倾斜，模拟真实草稿本
          style={{ fontFamily: "'Caveat', 'Comic Sans MS', 'Bradley Hand', cursive" }}
        >
          {/* 左上角草稿 */}
          <div className="absolute left-[5%] top-[15%] -rotate-6 text-3xl leading-relaxed text-slate-800 md:text-5xl">
            <p>{`// TODO: refactor this mess`}</p>
            <p className="ml-8">{`const build = (ideas) => {`}</p>
            <p className="ml-16">{`if (!coffee) throw "Error";`}</p>
            <p className="ml-16">{`return reality;`}</p>
            <p className="ml-8">{`}`}</p>
          </div>

          {/* 右侧架构图草稿 (用字符画模拟) */}
          <div className="absolute right-[10%] top-[30%] rotate-3 text-2xl leading-loose text-slate-900 md:text-4xl whitespace-pre">
            {`[ Client ] ---> [ API Gateway ]`}
            <br />
            {`                  |`}
            <br />
            {`                  v`}
            <br />
            {`             ( Database )  <-- needs index?`}
          </div>

          {/* 左下角散落的笔记 */}
          <div className="absolute bottom-[20%] left-[15%] -rotate-3 text-4xl text-slate-800 md:text-6xl">
            <p>{`/* Why is this returning undefined?! */`}</p>
            <p className="mt-4 text-2xl ml-10 underline decoration-wavy decoration-2">{`-> fixed: timing issue.`}</p>
          </div>
        </div>
      </div>

      {/* ================= 内容层：Bento Box 便当盒布局 ================= */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20 md:px-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-3 md:gap-6 lg:h-[600px]">
          
          {/* Box 1: 核心身份 (占 2x2) */}
          <Reveal className="md:col-span-2 md:row-span-2">
            <div className="group relative h-full w-full overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm transition-all hover:shadow-md md:p-10 border border-slate-200/60">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-slate-200/30 blur-3xl transition-all group-hover:bg-slate-300/40" />
              <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">
                01 — The Builder
              </p>
              <h2
                id="lab-dev-heading"
                className="text-4xl font-black uppercase leading-[1.1] tracking-tight text-slate-900 md:text-6xl"
              >
                Software <br /> Engineer.
              </h2>
              <p className="mt-6 max-w-sm text-sm font-medium leading-relaxed text-slate-500 md:text-base">
                写代码的人 · 也写工具和文档。<br/><br/>
                全栈与 CLI 都碰，更在乎长期可维护而不是一次性的炫技。用小实验验证想法，把重复的交给自动化。
              </p>
            </div>
          </Reveal>

          {/* Box 2: 终端仿真 (占 2x1) */}
          <Reveal className="md:col-span-2 md:row-span-1">
            <div className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-slate-800 bg-[#0A0A0A] text-slate-100 shadow-xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 bg-white/5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
                </div>
                <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  dev-environment — zsh
                </span>
              </div>
              <div className="flex-1 p-5 font-mono text-[11px] leading-relaxed text-emerald-400/90 md:p-6 md:text-xs">
                <span className="text-slate-500">$</span> mazen lab doctor <br />
                <span className="text-sky-300">✓</span> go &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.22+ <br />
                <span className="text-sky-300">✓</span> node &nbsp;&nbsp;&nbsp;&nbsp;22 <br />
                <span className="text-slate-400">→ next dev &nbsp;:3000 (turbopack)</span> <br />
                <br />
                <span className="text-amber-300/80"># 最近在折腾</span> <br />
                <span className="text-slate-300">- 日志 / 观测系统</span> <br />
                <span className="text-slate-300">- 本地 sqlite 与 pg 切换</span>
              </div>
            </div>
          </Reveal>

          {/* Box 3: 技术栈理念 (占 1x2 或者 1x1) */}
          <Reveal className="md:col-span-1 md:row-span-2">
            <div className="flex h-full w-full flex-col justify-between rounded-[2rem] bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm border border-slate-200/60 md:p-8">
              <div>
                <Cpu className="mb-4 h-7 w-7 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">架构与选型</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
                  不喜欢为了用而用。偏爱强类型的安全感，也喜欢简单粗暴的单体架构。界面和手感的细节，比「用了什么新框架」更重要。
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {[
                  { icon: Braces, label: "TS / Go" },
                  { icon: Binary, label: "CLI & API" },
                  { icon: Terminal, label: "DX" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                    <Icon className="h-3 w-3 text-slate-600" />
                    <span className="font-mono text-[10px] font-bold text-slate-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Box 4: 极简主义 (占 1x1) */}
          <Reveal className="md:col-span-1 md:row-span-1">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-[2rem] bg-slate-900 p-6 text-center shadow-md transition-transform hover:scale-[1.02]">
              <Layers className="mb-3 h-6 w-6 text-slate-300" />
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-white">
                Less is More
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                写更少的代码<br/>造更稳的系统
              </p>
            </div>
          </Reveal>

          {/* Box 5: 理念长条 (占 2x1) */}
          <Reveal className="md:col-span-2 md:row-span-1">
             <div className="group flex h-full w-full flex-col justify-center rounded-[2rem] border-2 border-dashed border-slate-300/60 bg-transparent p-6 hover:border-slate-400/80 md:p-8 transition-colors">
                <p className="text-base font-medium leading-relaxed text-slate-600 md:text-[17px]">
                  <span className="font-serif text-2xl text-slate-400">“</span>
                  不仅要把功能做出来，还要考虑三个月后自己接手时会不会骂娘。
                  <span className="font-serif text-2xl text-slate-400">”</span>
                </p>
             </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}