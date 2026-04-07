"use client";

import React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const FLASK_OUTLINE_D = [
  "M 74 30 L 126 30 A 2 2 0 0 1 128 32 L 128 36 A 2 2 0 0 1 126 38",
  "L 122 38 L 122 94 L 158 208 A 12 12 0 0 1 146 220 Q 100 228 54 220",
  "A 12 12 0 0 1 42 208 L 78 94 L 78 38 L 74 38 A 2 2 0 0 1 72 36",
  "L 72 32 A 2 2 0 0 1 74 30 Z"
].join(" ");

const FLASK_LIQUID_CLIP_D = [
  "M 78 40 L 122 40 L 122 94 L 158 208 A 12 12 0 0 1 146 220",
  "Q 100 228 54 220 A 12 12 0 0 1 42 208 L 78 94 Z"
].join(" ");

type ScaleMark = { y: number; major: boolean; label?: string; };

const FLASK_SCALE_MARKS: readonly ScaleMark[] = [
  { y: 110, major: true, label: "500" }, { y: 125, major: false },
  { y: 140, major: true, label: "400" }, { y: 155, major: false },
  { y: 170, major: true, label: "300" }, { y: 185, major: false },
  { y: 200, major: true, label: "200" },
];

const ICON_BOX = 24, ICON_IMG = 18, ICON_INSET = (ICON_BOX - ICON_IMG) / 2;

function hash01(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453123;
  return s - Math.floor(s);
}

/** SVG viewBox 200×264 内坐标；与页面 HTML 技术栈浮动层共用 */
export const WORKS_TECH_FLOATERS = [
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg", label: "Go", x: 82, y: 160 },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg", label: "Java", x: 108, y: 175 },
  { src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg", label: "Swift", x: 96, y: 195 },
] as const;

const FLOATERS = WORKS_TECH_FLOATERS;

const BUBBLES = [
  { cx: 85, cy: 212, r: 2.2, d: 0 }, { cx: 105, cy: 200, r: 1.6, d: 0.4 },
  { cx: 125, cy: 216, r: 2.5, d: 0.2 }, { cx: 70, cy: 204, r: 1.4, d: 0.65 },
  { cx: 135, cy: 210, r: 2.2, d: 0.15 }, { cx: 95, cy: 190, r: 1.3, d: 0.9 },
  { cx: 115, cy: 194, r: 1.7, d: 0.5 },
] as const;

function bubblePlumeChurn(tSec: number): number {
  let sum = 0;
  for (let k = 0; k < BUBBLES.length; k++) {
    const delay = BUBBLES[k].d, skew = hash01(k, 90) * 0.28 - 0.14, period = 2.4 + skew;
    const u = ((tSec + delay + hash01(k, 91) * 0.2) % period) / period;
    const rise = 0.08, peakW = 0.42 + hash01(k, 92) * 0.12;
    let env = 0;
    if (u < rise) env = u / rise;
    else if (u < rise + peakW) env = Math.sin(((u - rise) / peakW) * Math.PI);
    else env = Math.max(0, 1 - ((u - rise - peakW) / Math.max(0.001, 1 - rise - peakW))) * 0.35;
    sum += env * (0.45 + hash01(k, 93) * 0.55);
  }
  return Math.min(1, Math.min(1, sum * 0.34) * (0.35 + 0.65 * Math.pow((Math.sin(tSec * 0.14 + 0.55) + 1) * 0.5, 1.15)));
}

type FloaterPhys = { x: number; y: number; vx: number; vy: number; theta: number; omega: number; turbAx: number; turbAy: number; turbTau: number; turbFy: number; slowY: number; };

function useLiquidFloaterMotion(
  index: number,
  bodyRef: React.RefObject<SVGGElement | HTMLDivElement | null>,
  kind: "svg" | "html",
) {
  const reduceMotion = useReducedMotion();
  const phys = React.useRef<FloaterPhys | null>(null);

  React.useEffect(() => {
    if (reduceMotion) return;
    phys.current = { x: 0, y: 0, vx: (hash01(index, 20) - 0.5) * 18, vy: (hash01(index, 21) - 0.5) * 22, theta: (hash01(index, 25) - 0.5) * 0.22, omega: (hash01(index, 26) - 0.5) * 0.42, turbAx: 0, turbAy: 0, turbTau: 0, turbFy: 0, slowY: 0 };
    let last = performance.now(), raf = 0;

    const step = (now: number) => {
      const el = bodyRef.current, s = phys.current;
      if (!el || !s) { raf = requestAnimationFrame(step); return; }
      if (document.visibilityState === "hidden") { last = now; raf = requestAnimationFrame(step); return; }

      const dt = Math.min((now - last) / 1000, 0.048);
      last = now;
      const tSec = now * 0.001, churn = bubblePlumeChurn(tSec), calm = Math.pow(Math.max(0, 1 - churn), 1.05);

      const kDragX = (1.55 + hash01(index, 22) * 0.75) * (2.15 + hash01(index, 43) * 0.45), kDragY = (1.55 + hash01(index, 22) * 0.75) * (0.78 + hash01(index, 44) * 0.18), kSpring = 0.62 + hash01(index, 27) * 0.38;
      const kDragXEff = kDragX * (1 + calm * 2.35), kDragYEff = kDragY * (1 + calm * 1.65), kSpringEff = kSpring * (0.72 + 1.28 * calm);

      const ph0 = index * 1.17 + hash01(index, 40) * 6.28, ph1 = index * 0.83 + hash01(index, 41) * 6.28;
      const convectionX = (Math.sin(tSec * (0.34 + hash01(index, 40) * 0.1) + ph0) * 2.8 + Math.cos((tSec * (0.34 + hash01(index, 40) * 0.1) + ph0) * 0.62 + ph1 * 0.4) * 1.6 + Math.sin(tSec * (0.51 + hash01(index, 42) * 0.08) + index) * 1.1) * churn;
      const convectionY = (Math.sin(tSec * (0.67 + hash01(index, 41) * 0.18) + ph1) * 12.5 + Math.cos(tSec * (1.05 + hash01(index, 42) * 0.16) + ph0 * 0.55) * 7 + Math.sin(tSec * (0.29 + hash01(index, 40) * 0.09) + index * 0.7) * 5.5) * churn;

      s.slowY += (Math.random() - 0.5) * (26 + hash01(index, 48) * 22) * dt * (0.04 + 0.96 * churn);
      s.slowY -= s.slowY * (0.1 + hash01(index, 49) * 0.12) * (0.35 + 0.65 * churn) * dt;

      const blend = 1 - Math.exp(-dt / (0.14 + hash01(index, 29) * 0.14));
      s.turbAx = s.turbAx * (1 - blend * 0.2) + (Math.random() - 0.5) * (130 + hash01(index, 28) * 85) * (0.32 + hash01(index, 47) * 0.1) * blend * churn;
      s.turbAy = s.turbAy * (1 - blend * 0.2) + (Math.random() - 0.5) * (130 + hash01(index, 28) * 85) * blend * churn;
      s.turbFy = s.turbFy * (1 - Math.min(1, dt * 48) * 0.55) + (Math.random() - 0.5) * (88 + hash01(index, 32) * 55) * Math.min(1, dt * 48) * churn;

      s.turbAx *= Math.exp(-dt * (5.5 + 14 * calm)); s.turbAy *= Math.exp(-dt * (5.5 + 14 * calm)); s.turbFy *= Math.exp(-dt * (6 + 18 * calm));

      let ax = -kDragXEff * s.vx - kSpringEff * s.x + s.turbAx + convectionX;
      let ay = -kDragYEff * s.vy - kSpringEff * (s.y - s.slowY) + s.turbAy + s.turbFy + convectionY;

      if (s.x > 12) ax -= 16 * (s.x - 12); if (s.x < -12) ax -= 16 * (s.x + 12);
      if (s.y > 22) ay -= 16 * (s.y - 22); if (s.y < -22) ay -= 16 * (s.y + 22);

      s.vx += ax * dt; s.vy += ay * dt; s.x += s.vx * dt; s.y += s.vy * dt;

      s.turbTau = s.turbTau * (1 - blend * 0.22) + (Math.random() - 0.5) * (5 + hash01(index, 31) * 4.2) * blend * churn;
      s.turbTau *= Math.exp(-dt * 4 * calm);
      s.turbTau += Math.sin(tSec * (1.15 + hash01(index, 42) * 0.2) + index) * 1.8 * dt * 10 * churn;
      s.omega += (-( (4.2 + hash01(index, 30) * 0.9) * (1 + calm * 0.7)) * s.omega - 6.8 * s.theta + s.turbTau) * dt;
      s.theta += s.omega * dt;

      const deg = (s.theta * 180) / Math.PI;
      if (kind === "svg") {
        (el as SVGGElement).setAttribute("transform", `translate(${s.x.toFixed(4)},${s.y.toFixed(4)}) rotate(${deg.toFixed(4)}, ${ICON_BOX / 2}, ${ICON_BOX / 2})`);
      } else {
        (el as HTMLDivElement).style.transform = `translate(${s.x.toFixed(3)}px,${s.y.toFixed(3)}px) rotate(${deg.toFixed(3)}deg)`;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, index, kind]);
}

function LiquidFloaterGroup({ index, f }: { index: number; f: (typeof FLOATERS)[number] }) {
  const bodyRef = React.useRef<SVGGElement>(null);
  useLiquidFloaterMotion(index, bodyRef, "svg");

  return (
    <g transform={`translate(${f.x}, ${f.y})`}>
      <g ref={bodyRef}>
        <image href={f.src} x={ICON_INSET} y={ICON_INSET} width={ICON_IMG} height={ICON_IMG} preserveAspectRatio="xMidYMid meet" />
      </g>
    </g>
  );
}

/** HTML 内层：与瓶内 SVG 图标共用同一套液体浮动物理；外层容器交给 GSAP 做整屏位移 */
export function TechFloaterDrift({ index, className, children }: { index: number; className?: string; children: React.ReactNode }) {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  useLiquidFloaterMotion(index, bodyRef, "html");
  return (
    <div ref={bodyRef} className={cn("origin-center", className)} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

export default function FlaskBoil({ className, omitFloaters }: { className?: string; omitFloaters?: boolean }) {
  return (
    <div className={cn("flask-boil-root relative w-full select-none", className)}>
      <style>{`
        @keyframes flask-wave-slide { 0% { transform: translateX(0); } 100% { transform: translateX(-40px); } }
        @keyframes flask-bubble-rise { 0% { transform: translate(0, 0) scale(0.35); opacity: 0; } 12% { opacity: 0.75; } 100% { transform: translate(var(--bx, 6px), -90px) scale(1.05); opacity: 0; } }
        @keyframes flask-surface-shimmer { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.7; } }
      `}</style>
      <svg viewBox="0 0 200 264" className="flask-boil-svg h-auto w-full overflow-visible drop-shadow-2xl">
        <defs>
          <linearGradient id="flaskWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.92" />
            <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.85" />
          </linearGradient>
          <clipPath id="flaskLiquidClip"><path d={FLASK_LIQUID_CLIP_D} /></clipPath>
          <linearGradient id="flaskWallStroke" x1="60" y1="30" x2="140" y2="230" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#cbd5e1" stopOpacity="0.88" />
            <stop offset="72%" stopColor="#94a3b8" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <g clipPath="url(#flaskLiquidClip)">
          <rect className="flask-boil-liquid-base" x="20" y="145" width="160" height="100" fill="url(#flaskWaterGrad)" />
          <g className="flask-boil-effects flask-boil-surface">
            <g className="flask-boil-fx-animated">
              <g className="flask-boil-wave-wrap" style={{ mixBlendMode: "soft-light" }}>
                <g style={{ animation: "flask-wave-slide 2.8s linear infinite" }}>
                  {[0, 40, 80, 120].map((ox) => (
                    <path
                      key={ox}
                      className="flask-boil-wave-path"
                      style={{ animation: ox === 0 ? "flask-surface-shimmer 1.8s ease-in-out infinite" : "none" }}
                      d={`M ${-20 + ox} 145 Q ${10 + ox} 139 ${40 + ox} 145 T ${100 + ox} 145 T ${160 + ox} 145 L ${200 + ox} 167 L ${-40 + ox} 167 Z`}
                      fill="rgba(255,255,255,0.28)"
                      opacity={0.85}
                    />
                  ))}
                </g>
              </g>
              {BUBBLES.map((b, i) => (
                <circle key={i} data-bubble="" cx={b.cx} cy={b.cy} r={b.r} fill="rgba(255,255,255,0.45)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" style={{ animation: "flask-bubble-rise 2.4s ease-out infinite", animationDelay: `${b.d}s`, transformOrigin: "center", "--bx": `${(i % 5) - 2}px` } as React.CSSProperties} />
              ))}
            </g>
            {!omitFloaters && (
              <g className="flask-boil-floaters">
                {FLOATERS.map((f, i) => (
                  <LiquidFloaterGroup key={i} index={i} f={f} />
                ))}
              </g>
            )}
          </g>
        </g>

        <g className="flask-boil-chrome pointer-events-none select-none">
          {FLASK_SCALE_MARKS.map(({ y, major, label }) => {
            const xRight = 122 + (y - 94) * (36 / 114) - 3.5, xLeft = xRight - (major ? 7 : 4);
            return (
              <g key={y}>
                <line x1={xLeft} y1={y} x2={xRight} y2={y} stroke="rgba(255,255,255,0.45)" strokeWidth={major ? 1.2 : 0.8} strokeLinecap="round" />
                {major && label && <text x={xLeft - 3} y={y + 2} textAnchor="end" fontSize="6" fontWeight="600" fill="rgba(255,255,255,0.45)" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>{label}</text>}
              </g>
            );
          })}
        </g>

        <g className="flask-boil-chrome pointer-events-none select-none">
          <path d={FLASK_OUTLINE_D} fill="none" stroke="rgba(226,232,240,0.55)" strokeWidth="3.2" strokeLinejoin="round" />
          <path d={FLASK_OUTLINE_D} fill="none" stroke="url(#flaskWallStroke)" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M 74 38 L 126 38" fill="none" stroke="url(#flaskWallStroke)" strokeWidth="1.2" />
          <path d="M 80 40 L 80 93 L 46 205" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M 120 40 L 120 93 L 148 185" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M 54 216 Q 100 224 146 216" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}