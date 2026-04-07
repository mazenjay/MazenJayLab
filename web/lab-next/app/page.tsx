"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Smartphone, Terminal, Layers, Mail } from "lucide-react";
import Script from "next/script";

import FlaskBoil from "@/components/FlaskBoil";
import { HeroMagazineIntro } from "@/components/HeroMagazineIntro";
import { LabJournalSection } from "@/components/LabJournalSection";
import { LabScrollNav } from "@/components/LabScrollNav";
import { WorksProject3DCard } from "@/components/WorksProject3DCard";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const APPS_DATA = [
  { num: "01", name: "QUANTUM FLOW", desc: "iOS productivity tracker engineered with fluid animations and CoreData.", tags: ["Swift", "CoreData", "Metal"], icon: <Smartphone className="w-12 h-12 text-cyan-300" /> },
  { num: "02", name: "NEXUS SYNC", desc: "Real-time collaborative workspace bridging the gap between teams.", tags: ["React Native", "WebSockets"], icon: <Layers className="w-12 h-12 text-blue-300" /> },
  { num: "03", name: "TERMINAL X", desc: "Blazing fast CLI tool wrapper with a native GUI for power users.", tags: ["macOS", "Golang", "Rust"], icon: <Terminal className="w-12 h-12 text-teal-300" /> },
];

export default function MazenJayLab() {
  const mainRef = useRef<HTMLDivElement>(null);

  const heroSectionRef = useRef<HTMLElement>(null);
  const flaskStageRef = useRef<HTMLDivElement>(null);
  const flaskWrapperRef = useRef<HTMLDivElement>(null);
  const flaskBloomRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroMagazineRef = useRef<HTMLDivElement>(null);

  const liquidWashRef = useRef<HTMLDivElement>(null);
  const airWashRef = useRef<HTMLDivElement>(null);
  const cineFogRef = useRef<HTMLDivElement>(null);
  const cineGrainRef = useRef<HTMLDivElement>(null);
  const cineVignetteRef = useRef<HTMLDivElement>(null);
  /** Hero 结束前叠加深色渐变 + 微光，过渡到 Works 水下展厅 */
  const worksBridgeRef = useRef<HTMLDivElement>(null);

  const horizontalSectionRef = useRef<HTMLElement>(null);
  const appsContainerRef = useRef<HTMLDivElement>(null);
  const journalSectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const stage = flaskStageRef.current;
    const wrap = flaskWrapperRef.current;
    const hero = heroSectionRef.current;
    const wash = liquidWashRef.current;
    const air = airWashRef.current;
    const fog = cineFogRef.current;
    const grain = cineGrainRef.current;
    const bloom = flaskBloomRef.current;
    const journal = journalSectionRef.current;
    const vignette = cineVignetteRef.current;
    const worksBridge = worksBridgeRef.current;

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize, { passive: true });

    let flaskFxReduced = false;

    const DUR_LIQUID = 0.68;
    const DUR_FOG = 0.55;
    const DUR_GRAIN = 0.45;

    if (stage && wrap && hero) {
      const chromeLayers = wrap.querySelectorAll<SVGElement | HTMLElement>(".flask-boil-chrome");
      const effectsEl = wrap.querySelector<SVGElement | HTMLElement>(".flask-boil-effects");
      const fxEl = wrap.querySelector<SVGElement | HTMLElement>(".flask-boil-fx-animated");
      const liquidBaseEl = wrap.querySelector<SVGElement | HTMLElement>(".flask-boil-liquid-base");
      const floatersEl = wrap.querySelector<SVGElement | HTMLElement>(".flask-boil-floaters");

      gsap.set(stage, { transformOrigin: "50% 72%", scale: 1, yPercent: 0, autoAlpha: 1 });
      gsap.set(wrap, { autoAlpha: 1 });
      gsap.set(chromeLayers, { autoAlpha: 1 });
      if (effectsEl) gsap.set(effectsEl, { autoAlpha: 1 });
      if (fxEl) gsap.set(fxEl, { autoAlpha: 1 });
      if (liquidBaseEl) gsap.set(liquidBaseEl, { autoAlpha: 1 });
      if (floatersEl) gsap.set(floatersEl, { autoAlpha: 1 });
      if (wash) gsap.set(wash, { autoAlpha: 0 });
      if (air) gsap.set(air, { autoAlpha: 0 });
      if (fog) gsap.set(fog, { autoAlpha: 0 });
      if (grain) gsap.set(grain, { autoAlpha: 0 });
      if (vignette) gsap.set(vignette, { autoAlpha: 0 });
      if (worksBridge) gsap.set(worksBridge, { autoAlpha: 0 });
      if (bloom) gsap.set(bloom, { autoAlpha: 1 });
      const ht = heroTextRef.current;
      if (ht) gsap.set(ht, { autoAlpha: 1, scale: 1 });
      const magazine = heroMagazineRef.current;
      if (magazine) gsap.set(magazine, { autoAlpha: 0 });

      const diveTl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "lab-scene-a-hero",
          trigger: hero,
          start: "top top",
          end: "+=228%",
          pin: true,
          pinSpacing: true,
          /* fixed 避免 transform pin 与多栏/衬线正文叠加以致子像素抖动 */
          pinType: "fixed",
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (!flaskFxReduced && p > 0.022) {
              flaskFxReduced = true;
              wrap.classList.add("flask-fx-reduced");
            } else if (flaskFxReduced && p < 0.007) {
              flaskFxReduced = false;
              wrap.classList.remove("flask-fx-reduced");
            }
          },
          onRefresh: (self) => {
            const p = self.progress;
            const reduced = p > 0.015;
            flaskFxReduced = reduced;
            wrap.classList.toggle("flask-fx-reduced", reduced);
          },
        },
      });

      if (ht) {
        diveTl.to(ht, { autoAlpha: 0, scale: 1.08, ease: "power1.out", duration: 0.2 }, 0);
      }

      if (fxEl) {
        diveTl.to(fxEl, { autoAlpha: 0, ease: "power1.inOut", duration: 0.32 }, 0.05);
      }
      if (bloom) {
        diveTl.to(bloom, { autoAlpha: 0, duration: 0.26 }, 0.02);
      }
      if (liquidBaseEl) {
        diveTl.to(liquidBaseEl, { autoAlpha: 0, ease: "power1.inOut", duration: 0.34 }, 0.22);
      }
      if (floatersEl) {
        diveTl.to(floatersEl, { autoAlpha: 0, ease: "power1.inOut", duration: 0.34 }, 0.22);
      }

      /* 液体与图标先没；锥形轮廓/刻度最后消失，再隐整层 wrap */
      const chromeOut = 0.56; /* 紧接在 liquid/floaters 时段(0.22+0.34)之后 */
      diveTl.to(chromeLayers, { autoAlpha: 0, ease: "power1.inOut", duration: 0.22 }, chromeOut);
      diveTl.to(wrap, { autoAlpha: 0, ease: "power1.inOut", duration: 0.14 }, chromeOut + 0.16);

      const magIn = chromeOut + 0.16 + 0.14;
      if (magazine) {
        diveTl.to(magazine, { autoAlpha: 1, ease: "power2.out", duration: 0.36 }, magIn);
        diveTl.to(magazine, { autoAlpha: 0, ease: "power1.in", duration: 0.42 }, magIn + 1.0);
      }

      /* 封面淡出前后：压暗 + 微光 + 雾，衔接 Works 水下展厅 */
      const bridgeT = magIn + 0.7;
      if (worksBridge) {
        diveTl.to(worksBridge, { autoAlpha: 1, ease: "power2.inOut", duration: 0.55 }, bridgeT);
      }
      if (air) {
        diveTl.to(air, { autoAlpha: 0.22, ease: "power1.inOut", duration: 0.48 }, bridgeT + 0.04);
      }
      if (fog) {
        diveTl.to(fog, { autoAlpha: 0.72, ease: "power1.inOut", duration: 0.42 }, bridgeT + 0.06);
      }
      if (vignette) {
        diveTl.to(vignette, { autoAlpha: 0.62, ease: "power1.inOut", duration: 0.5 }, bridgeT + 0.02);
      }

      if (wash) {
        diveTl.to(wash, { autoAlpha: 1, ease: "power1.inOut", duration: DUR_LIQUID }, 0.08);
      }
      if (fog) {
        diveTl.to(fog, { autoAlpha: 0.58, ease: "power1.inOut", duration: DUR_FOG }, 0.12);
      }
      if (grain) {
        diveTl.to(grain, { autoAlpha: 0.1, ease: "power1.out", duration: DUR_GRAIN }, 0.18);
      }
      if (vignette) {
        diveTl.to(vignette, { autoAlpha: 0.52, ease: "power1.inOut", duration: 0.78 }, 0.05);
      }
    }

    const track = appsContainerRef.current;
    const hSection = horizontalSectionRef.current;
    if (track && hSection) {
      const getScrollAmount = () => Math.max(0, track.scrollWidth - window.innerWidth);

      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: () => -getScrollAmount(),
          ease: "none",
          force3D: true,
          scrollTrigger: {
            id: "lab-scene-b-works",
            trigger: hSection,
            start: "top top",
            end: () => `+=${getScrollAmount()}`,
            pin: true,
            pinSpacing: true,
            pinType: "fixed",
            scrub: true,
            fastScrollEnd: true,
            invalidateOnRefresh: true,
          },
        }
      );
    }

    if (journal && wash && air) {
      const fogEl = cineFogRef.current;
      const grainEl = cineGrainRef.current;
      const vigEl = cineVignetteRef.current;
      const bridgeEl = worksBridgeRef.current;

      const surfaceTl = gsap.timeline({
        scrollTrigger: {
          id: "lab-scene-surface",
          trigger: journal,
          start: "top 90%",
          end: "top 18%",
          scrub: 0.48,
          invalidateOnRefresh: true,
        },
      });

      const S = 1;
      surfaceTl.to(wash, { autoAlpha: 0, ease: "power1.inOut", duration: S }, 0);
      surfaceTl.to(air, { autoAlpha: 1, ease: "power1.inOut", duration: S }, 0);
      if (bridgeEl) surfaceTl.to(bridgeEl, { autoAlpha: 0, ease: "power1.inOut", duration: S }, 0);
      if (fogEl) surfaceTl.to(fogEl, { autoAlpha: 0.1, ease: "power1.inOut", duration: S }, 0);
      if (grainEl) surfaceTl.to(grainEl, { autoAlpha: 0.038, ease: "power1.inOut", duration: S }, 0);
      if (vigEl) surfaceTl.to(vigEl, { autoAlpha: 0.06, ease: "power1.inOut", duration: S }, 0);
    }

    return () => {
      window.removeEventListener("resize", onResize, { passive: true } as AddEventListenerOptions);
    };
  }, { scope: mainRef });

  return (
    <>
      {/*
        刷新后浏览器会先把滚动恢复到中腰再交 React，首帧 ScrollTrigger 会按错进度算一层再被拉回顶部 → 闪一下。
        beforeInteractive 在 hydration 前执行，与首帧对齐到 0；不要用 rAF + refresh，避免二次布局闪烁。
      */}
      <Script id="lab-reload-scroll-reset" strategy="beforeInteractive">
        {`(function(){try{var nav=performance.getEntriesByType('navigation')[0];var isReload=nav&&nav.type==='reload';if(!isReload&&typeof performance!=='undefined'&&performance.navigation)isReload=performance.navigation.type===1;if(!isReload)return;history.scrollRestoration='manual';window.scrollTo(0,0);document.documentElement.scrollTop=0;if(document.body)document.body.scrollTop=0}catch(e){}})()`}
      </Script>
    <main ref={mainRef} className="relative overflow-x-hidden bg-slate-50 font-sans text-slate-900">
      <LabScrollNav />
      <svg className="pointer-events-none fixed h-0 w-0 opacity-0" aria-hidden>
        <defs>
          <filter id="labCineGrain" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="2" stitchTiles="stitch" result="n" />
            <feColorMatrix type="saturate" values="0" in="n" result="g" />
            <feComponentTransfer in="g" result="c">
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <style>{`
        .flask-fx-reduced .flask-boil-svg { filter: none !important; -webkit-filter: none !important; }
        .flask-fx-reduced .flask-boil-wave-wrap { mix-blend-mode: normal !important; }
        .flask-fx-reduced .flask-boil-wave-path { fill: rgba(255, 255, 255, 0.22) !important; opacity: 0.75 !important; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-[5] isolate" aria-hidden>
        <div
          ref={liquidWashRef}
          className="invisible absolute inset-0 opacity-0"
          style={{
            background:
              "linear-gradient(168deg, rgb(13 148 136 / 0.92) 0%, rgb(12 74 110 / 0.94) 34%, rgb(30 58 138 / 0.96) 68%, rgb(15 23 42) 100%)",
          }}
        />

        <div
          ref={airWashRef}
          className="invisible absolute inset-0 opacity-0"
          style={{
            background:
              "linear-gradient(180deg, rgb(191 219 254 / 0.55) 0%, rgb(248 250 252) 42%, rgb(255 255 255) 100%)",
          }}
        />

        {/* 与 liquidWash 同色相加深，避免 Hero 末段与 Works 像两块拼接 */}
        <div
          ref={worksBridgeRef}
          className="invisible absolute inset-0 opacity-0"
          style={{
            background:
              "linear-gradient(168deg, rgb(13 148 136 / 0.06) 0%, rgb(15 23 42 / 0.38) 42%, rgb(2 6 23 / 0.72) 78%, rgb(2 6 23 / 0.88) 100%), radial-gradient(ellipse 130% 85% at 50% 108%, rgb(34 211 238 / 0.065) 0%, transparent 58%)",
          }}
        />

        <div
          ref={cineFogRef}
          className="invisible absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(ellipse 78% 32% at 50% 12%, rgb(255 255 255 / 0.06) 0%, transparent 52%), radial-gradient(ellipse 105% 72% at 50% 108%, rgb(15 23 42 / 0.68) 0%, transparent 58%), linear-gradient(180deg, rgb(2 6 23 / 0.18) 0%, rgb(2 6 23 / 0.06) 45%, rgb(2 6 23 / 0.22) 100%)",
          }}
        />

        <div
          ref={cineGrainRef}
          className="absolute inset-0 mix-blend-overlay opacity-0"
          style={{ filter: "url(#labCineGrain)" }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={flaskStageRef}
            className="relative w-[280px] pointer-events-auto md:w-[380px]"
            style={{ transformOrigin: "50% 72%" }}
          >
            <div ref={flaskWrapperRef} className="relative">
              <div
                ref={flaskBloomRef}
                className="absolute top-1/2 left-1/2 -z-10 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 scale-150 rounded-full bg-cyan-300/40 blur-[60px]"
              />
              <FlaskBoil />
            </div>
          </div>
        </div>

        <div
          ref={cineVignetteRef}
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(ellipse 88% 78% at 50% 50%, transparent 0%, transparent 18%, rgb(2 6 23 / 0.28) 52%, rgb(2 6 23 / 0.58) 100%)",
          }}
        />
      </div>

      <section
        id="lab-hero"
        ref={heroSectionRef}
        className="relative z-10 flex h-screen w-full scroll-mt-0 flex-col items-center justify-center"
      >
        <div ref={heroTextRef} className="pointer-events-none absolute bottom-16 z-20 flex flex-col items-center">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 drop-shadow-md md:text-7xl">
            Mazen Jay Lab
          </h1>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-slate-500 md:text-sm">
            Scroll To Explore
          </p>
        </div>
        <HeroMagazineIntro ref={heroMagazineRef} />
      </section>

      <section
        id="lab-works"
        ref={horizontalSectionRef}
        className="relative z-10 h-screen w-full scroll-mt-0 overflow-hidden bg-transparent text-white"
      >
        <div className="pointer-events-none absolute left-6 top-12 z-50 md:left-20 md:top-20">
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-cyan-200/80 md:text-xs">
            Scene II · 水下展厅
          </p>
          <h2 className="text-5xl font-black uppercase leading-none tracking-tighter text-white/14 md:text-[130px]">
            Works
          </h2>
          <p className="mt-5 font-mono text-sm font-bold uppercase tracking-widest text-cyan-300/90">
            Selected projects
          </p>
        </div>

        <div
          ref={appsContainerRef}
          className="absolute left-0 top-0 flex h-full items-center pl-[100vw] pr-[20vw] will-change-transform"
        >
          {APPS_DATA.map((app, i) => (
            <div key={i} className="relative mx-6 flex h-[65vh] w-[85vw] shrink-0 md:mx-12 md:w-[45vw]">
              <div className="pointer-events-none absolute -right-8 -top-16 z-0 select-none text-[200px] font-black leading-none text-white/[0.03]">
                {app.num}
              </div>
              <div className="relative z-10 h-full w-full">
                <WorksProject3DCard
                  name={app.name}
                  desc={app.desc}
                  tags={app.tags}
                  icon={app.icon}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <LabJournalSection ref={journalSectionRef} />

      <section
        id="lab-contact"
        className="relative z-20 flex h-screen scroll-mt-0 flex-col items-center justify-center overflow-hidden bg-[#061224] text-white"
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
          <span className="text-center text-[20vw] font-black uppercase leading-none tracking-tighter">READY.</span>
        </div>

        <svg viewBox="0 0 200 264" className="mb-12 w-[150px] opacity-30" aria-hidden>
          <path
            d="M 74 30 L 126 30 A 2 2 0 0 1 128 32 L 128 36 A 2 2 0 0 1 126 38 L 122 38 L 122 94 L 158 208 A 12 12 0 0 1 146 220 Q 100 228 54 220 A 12 12 0 0 1 42 208 L 78 94 L 78 38 L 74 38 A 2 2 0 0 1 72 36 L 72 32 A 2 2 0 0 1 74 30 Z"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>

        <h2 className="z-10 mb-8 text-center text-4xl font-black uppercase tracking-tighter md:text-6xl">
          Start the Next <br /> Experiment.
        </h2>

        <a
          href="mailto:hello@mazenjay.com"
          className="z-10 flex items-center gap-4 rounded-full bg-white px-8 py-4 font-bold uppercase tracking-widest text-slate-900 transition-colors duration-300 hover:bg-cyan-400"
        >
          <Mail className="h-5 w-5" />
          Initialize Contact
        </a>
      </section>
    </main>
    </>
  );
}
