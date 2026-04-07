"use client";

/**
 * 首屏实验风格：100% 复刻版锥形瓶 + 半透明侧边刻度 + 沸腾水体 + 随波摆动技术图标。
 * 特点：矩形圆角瓶口、直线硬折角肩部、平滑底部大圆角、附着在右侧斜壁的容量刻度。
 */

import React from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/** 
 * 锥形瓶外轮廓（完全依照提供的参考图片系坐标）：
 */
const FLASK_OUTLINE_D = [
  "M 74 30",                       // 左上角圆角起点
  "L 126 30",                      // 瓶口顶边
  "A 2 2 0 0 1 128 32",            // 右上圆角
  "L 128 36",                      // 瓶口右侧边
  "A 2 2 0 0 1 126 38",            // 右下圆角
  "L 122 38",                      // 向内收缩连接瓶颈
  "L 122 94",                      // 右侧垂直瓶颈（直线）
  "L 158 208",                     // 右侧斜向瓶壁（直线，产生硬折角）
  "A 12 12 0 0 1 146 220",         // 底部右侧大圆角
  "Q 100 228 54 220",              // 底部平滑曲线
  "A 12 12 0 0 1 42 208",          // 底部左侧大圆角
  "L 78 94",                       // 左侧斜向瓶壁（直线）
  "L 78 38",                       // 左侧垂直瓶颈（直线）
  "L 74 38",                       // 向外延展连接瓶口
  "A 2 2 0 0 1 72 36",             // 左下圆角
  "L 72 32",                       // 瓶口左侧边
  "A 2 2 0 0 1 74 30",             // 左上圆角
  "Z"
].join(" ");

/** 
 * 杯内液体区域裁切：提取上面轮廓中内部空间的坐标
 */
const FLASK_LIQUID_CLIP_D = [
  "M 78 40",
  "L 122 40",
  "L 122 94",
  "L 158 208",
  "A 12 12 0 0 1 146 220",
  "Q 100 228 54 220",
  "A 12 12 0 0 1 42 208",
  "L 78 94",
  "Z"
].join(" ");

/**
 * 右侧斜壁体积刻度：
 * 从上到下 Y 值递增，代表液体高度降低，所以标识的毫升数(label)越来越小。
 */
type ScaleMark = {
  y: number;
  major: boolean;
  label?: string; // 可选的字符串
};

const FLASK_SCALE_MARKS: readonly ScaleMark[] = [
  { y: 110, major: true, label: "500" },
  { y: 125, major: false },
  { y: 140, major: true, label: "400" },
  { y: 155, major: false },
  { y: 170, major: true, label: "300" },
  { y: 185, major: false },
  { y: 200, major: true, label: "200" },
] as const;

const ICON_BOX = 24;
const ICON_IMG = 18;
const ICON_INSET = (ICON_BOX - ICON_IMG) / 2;

/** 确定性 0–1，避免 SSR/CSR 不一致 */
function hash01(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453123;
  return s - Math.floor(s);
}

const GO_ICON =
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg";
const JAVA_ICON =
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg";
const SWIFT_ICON =
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg";

type Floater = {
  src: string;
  label: string;
  x: number;
  y: number;
};

/** 
 * Java 的 X 坐标向左微调到了 108，给右侧半透明刻度留出最佳视觉区
 */
const FLOATERS: Floater[] = [
  { src: GO_ICON, label: "Go", x: 82, y: 160 },
  { src: JAVA_ICON, label: "Java", x: 108, y: 175 },
  { src: SWIFT_ICON, label: "Swift", x: 96, y: 195 },
];

/** 气泡发射坐标同步下移至底部大圆角附近 */
const BUBBLES = [
  { cx: 85, cy: 212, r: 2.2, d: 0 },
  { cx: 105, cy: 200, r: 1.6, d: 0.4 },
  { cx: 125, cy: 216, r: 2.5, d: 0.2 },
  { cx: 70, cy: 204, r: 1.4, d: 0.65 },
  { cx: 135, cy: 210, r: 2.2, d: 0.15 },
  { cx: 95, cy: 190, r: 1.3, d: 0.9 },
  { cx: 115, cy: 194, r: 1.7, d: 0.5 },
] as const;

const BUBBLE_CYCLE_SEC = 2.4;

function bubblePlumeChurn(tSec: number): number {
  let sum = 0;
  for (let k = 0; k < BUBBLES.length; k++) {
    const delay = BUBBLES[k].d;
    const skew = hash01(k, 90) * 0.28 - 0.14;
    const period = BUBBLE_CYCLE_SEC + skew;
    const u = ((tSec + delay + hash01(k, 91) * 0.2) % period) / period;
    const rise = 0.08;
    const peakW = 0.42 + hash01(k, 92) * 0.12;
    let env = 0;
    if (u < rise) env = u / rise;
    else if (u < rise + peakW) {
      const v = (u - rise) / peakW;
      env = Math.sin(v * Math.PI);
    } else {
      const tail = (u - rise - peakW) / Math.max(0.001, 1 - rise - peakW);
      env = Math.max(0, 1 - tail) * 0.35;
    }
    sum += env * (0.45 + hash01(k, 93) * 0.55);
  }
  const raw = Math.min(1, sum * 0.34);
  const boilPulse = Math.pow((Math.sin(tSec * 0.14 + 0.55) + 1) * 0.5, 1.15);
  const modulation = 0.35 + 0.65 * boilPulse;
  return Math.min(1, raw * modulation);
}

type FloaterPhys = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  theta: number;
  omega: number;
  turbAx: number;
  turbAy: number;
  turbTau: number;
  turbFy: number;
  slowY: number;
};

function LiquidFloaterGroup({ index, f }: { index: number; f: Floater }) {
  const reduceMotion = useReducedMotion();
  const bodyRef = React.useRef<SVGGElement>(null);
  const phys = React.useRef<FloaterPhys | null>(null);

  const cx = ICON_BOX / 2;
  const cy = ICON_BOX / 2;

  const icon = (
    <image
      href={f.src}
      x={ICON_INSET}
      y={ICON_INSET}
      width={ICON_IMG}
      height={ICON_IMG}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    />
  );

  React.useEffect(() => {
    if (reduceMotion) return;

    const p: FloaterPhys = {
      x: 0,
      y: 0,
      vx: (hash01(index, 20) - 0.5) * 18,
      vy: (hash01(index, 21) - 0.5) * 22,
      theta: (hash01(index, 25) - 0.5) * 0.22,
      omega: (hash01(index, 26) - 0.5) * 0.42,
      turbAx: 0,
      turbAy: 0,
      turbTau: 0,
      turbFy: 0,
      slowY: 0,
    };
    phys.current = p;

    const kDragBase = 1.55 + hash01(index, 22) * 0.75;
    const kDragX = kDragBase * (2.15 + hash01(index, 43) * 0.45);
    const kDragY = kDragBase * (0.78 + hash01(index, 44) * 0.18);
    const kSpring = 0.62 + hash01(index, 27) * 0.38;
    const kBound = 16;
    const xMax = 12; 
    const yMax = 22;  
    const noiseSigma = 130 + hash01(index, 28) * 85;
    const noiseXRatio = 0.32 + hash01(index, 47) * 0.1;
    const tauTurb = 0.14 + hash01(index, 29) * 0.14;
    const fastTurbAmpY = 88 + hash01(index, 32) * 55;
    const kDragAng = 4.2 + hash01(index, 30) * 0.9;
    const kRestoreAng = 6.8;
    const torqueSigma = 5 + hash01(index, 31) * 4.2;
    const slowYStep = 26 + hash01(index, 48) * 22;
    const slowYHome = 0.1 + hash01(index, 49) * 0.12;

    const hW1 = hash01(index, 40);
    const hW2 = hash01(index, 41);
    const hW3 = hash01(index, 42);

    let last = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const el = bodyRef.current;
      const s = phys.current;
      if (!el || !s) {
        raf = requestAnimationFrame(step);
        return;
      }

      if (document.visibilityState === "hidden") {
        last = now;
        raf = requestAnimationFrame(step);
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.048);
      last = now;

      const tSec = now * 0.001;
      const churn = bubblePlumeChurn(tSec);
      const calm = Math.pow(Math.max(0, 1 - churn), 1.05);

      const kDragXEff = kDragX * (1 + calm * 2.35);
      const kDragYEff = kDragY * (1 + calm * 1.65);
      const kSpringEff = kSpring * (0.72 + 1.28 * calm);

      const ph0 = index * 1.17 + hW1 * 6.28;
      const ph1 = index * 0.83 + hW2 * 6.28;
      const slowPhase = tSec * (0.34 + hW1 * 0.1) + ph0;
      const convectionX =
        (Math.sin(slowPhase) * 2.8 +
          Math.cos(slowPhase * 0.62 + ph1 * 0.4) * 1.6 +
          Math.sin(tSec * (0.51 + hW3 * 0.08) + index) * 1.1) *
        churn;
      const convectionY =
        (Math.sin(tSec * (0.67 + hW2 * 0.18) + ph1) * 12.5 +
          Math.cos(tSec * (1.05 + hW3 * 0.16) + ph0 * 0.55) * 7 +
          Math.sin(tSec * (0.29 + hW1 * 0.09) + index * 0.7) * 5.5) *
        churn;

      s.slowY += (Math.random() - 0.5) * slowYStep * dt * (0.04 + 0.96 * churn);
      s.slowY -= s.slowY * slowYHome * (0.35 + 0.65 * churn) * dt;

      const blend = 1 - Math.exp(-dt / tauTurb);
      s.turbAx =
        s.turbAx * (1 - blend * 0.2) +
        (Math.random() - 0.5) *
          noiseSigma *
          noiseXRatio *
          blend *
          churn;
      s.turbAy =
        s.turbAy * (1 - blend * 0.2) +
        (Math.random() - 0.5) * noiseSigma * blend * churn;

      const fBlend = Math.min(1, dt * 48);
      s.turbFy =
        s.turbFy * (1 - fBlend * 0.55) +
        (Math.random() - 0.5) * fastTurbAmpY * fBlend * churn;

      const visc = Math.exp(-dt * (5.5 + 14 * calm));
      s.turbAx *= visc;
      s.turbAy *= visc;
      s.turbFy *= Math.exp(-dt * (6 + 18 * calm));

      let ax = -kDragXEff * s.vx - kSpringEff * s.x + s.turbAx + convectionX;
      let ay =
        -kDragYEff * s.vy -
        kSpringEff * (s.y - s.slowY) +
        s.turbAy +
        s.turbFy +
        convectionY;

      if (s.x > xMax) ax -= kBound * (s.x - xMax);
      if (s.x < -xMax) ax -= kBound * (s.x + xMax);
      if (s.y > yMax) ay -= kBound * (s.y - yMax);
      if (s.y < -yMax) ay -= kBound * (s.y + yMax);

      s.vx += ax * dt;
      s.vy += ay * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      s.turbTau =
        s.turbTau * (1 - blend * 0.22) +
        (Math.random() - 0.5) * torqueSigma * blend * churn;
      s.turbTau *= Math.exp(-dt * 4 * calm);
      s.turbTau +=
        Math.sin(tSec * (1.15 + hW3 * 0.2) + index) * 1.8 * dt * 10 * churn;
      const alpha =
        -(kDragAng * (1 + calm * 0.7)) * s.omega - kRestoreAng * s.theta + s.turbTau;
      s.omega += alpha * dt;
      s.theta += s.omega * dt;

      const deg = (s.theta * 180) / Math.PI;
      el.setAttribute(
        "transform",
        `translate(${s.x.toFixed(4)},${s.y.toFixed(4)}) rotate(${deg.toFixed(4)}, ${cx}, ${cy})`,
      );

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, index, cx, cy]);

  return (
    <g transform={`translate(${f.x}, ${f.y})`}>
      <title>{f.label}</title>
      <g ref={bodyRef} transform={`translate(0,0) rotate(0, ${cx}, ${cy})`}>
        {icon}
      </g>
    </g>
  );
}

function FlaskBoilStyles() {
  return (
    <style>{`
      @keyframes flask-wave-slide {
        0% { transform: translateX(0); }
        100% { transform: translateX(-40px); }
      }
      @keyframes flask-bubble-rise {
        0% { transform: translate(0, 0) scale(0.35); opacity: 0; }
        12% { opacity: 0.75; }
        100% { transform: translate(var(--bx, 6px), -90px) scale(1.05); opacity: 0; }
      }
      @keyframes flask-surface-shimmer {
        0%, 100% { opacity: 0.35; }
        50% { opacity: 0.7; }
      }
      .flask-boil-root [data-wave-strip] {
        animation: flask-wave-slide 2.8s linear infinite;
      }
      .flask-boil-root [data-bubble] {
        animation: flask-bubble-rise 2.4s ease-out infinite;
        animation-delay: var(--bd, 0s);
        transform-box: fill-box;
        transform-origin: center;
      }
      .flask-boil-surface [data-shimmer] {
        animation: flask-surface-shimmer 1.8s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .flask-boil-root [data-wave-strip],
        .flask-boil-root [data-bubble],
        .flask-boil-surface [data-shimmer] {
          animation: none !important;
        }
      }
    `}</style>
  );
}

export function FlaskBoilHero({ className }: { className?: string }) {
  const titleId = React.useId();

  return (
    <>
      <FlaskBoilStyles />
      <div
        className={cn(
          "flask-boil-root relative mx-auto flex w-full max-w-[min(92vw,400px)] select-none flex-col items-center",
          className,
        )}
        role="img"
        aria-labelledby={titleId}
      >
        <span id={titleId} className="sr-only">
          实验室锥形瓶，内部液体沸腾，技术图标随水波浮动
        </span>

        <svg
          viewBox="0 0 200 264"
          className="h-auto w-full overflow-visible drop-shadow-lg"
          aria-hidden
        >
          <defs>
            {/* 水体颜色层次 */}
            <linearGradient id="flaskWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" stopOpacity="0.92" />
              <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.85" />
            </linearGradient>

            <clipPath id="flaskLiquidClip" clipPathUnits="userSpaceOnUse">
              <path d={FLASK_LIQUID_CLIP_D} />
            </clipPath>

            <linearGradient
              id="flaskWallStroke"
              x1="60"
              y1="30"
              x2="140"
              y2="230"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#cbd5e1" stopOpacity="0.88" />
              <stop offset="72%" stopColor="#94a3b8" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* —— 1. 内部水体渲染层 —— */}
          <g clipPath="url(#flaskLiquidClip)">
            <rect x="20" y="145" width="160" height="100" fill="url(#flaskWaterGrad)" />

            {/* 液面波动曲线 */}
            <g className="flask-boil-surface" style={{ mixBlendMode: "soft-light" }}>
              <g data-wave-strip>
                {[0, 40, 80, 120].map((ox) => (
                  <path
                    key={ox}
                    data-shimmer={ox === 0 ? "" : undefined}
                    d={`M ${-20 + ox} 145 Q ${10 + ox} 139 ${40 + ox} 145 T ${100 + ox} 145 T ${160 + ox} 145 L ${200 + ox} 167 L ${-40 + ox} 167 Z`}
                    fill="rgba(255,255,255,0.28)"
                    opacity={0.85}
                  />
                ))}
              </g>
            </g>

            {/* 气泡 */}
            {BUBBLES.map((b, i) => (
              <circle
                key={i}
                data-bubble=""
                cx={b.cx}
                cy={b.cy}
                r={b.r}
                fill="rgba(255,255,255,0.45)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="0.4"
                style={
                  {
                    "--bd": `${b.d}s`,
                    "--bx": `${(i % 5) - 2}px`,
                  } as React.CSSProperties
                }
              />
            ))}

            {/* 浮动图标，在最上层 */}
            {FLOATERS.map((f, i) => (
              <LiquidFloaterGroup key={i} index={i} f={f} />
            ))}
          </g>

          {/* —— 2. 右侧玻璃表面的半透明刻度 —— */}
          {/* 使用 pointer-events-none 防止影响交互，低透明度保证不遮挡背景图标 */}
          <g aria-hidden className="pointer-events-none select-none">
            {FLASK_SCALE_MARKS.map(({ y, major, label }) => {
              // 根据右侧斜率计算当前高度下的壁沿 X 坐标
              // X = 122 + (Y - 94) * (36 / 114)
              const wallX = 122 + (y - 94) * (36 / 114);
              const xRight = wallX - 3.5; // 从内壁向左偏移一点点，防止贴着描边
              const len = major ? 7 : 4;
              const xLeft = xRight - len;

              return (
                <g key={y}>
                  <line
                    x1={xLeft}
                    y1={y}
                    x2={xRight}
                    y2={y}
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth={major ? 1.2 : 0.8}
                    strokeLinecap="round"
                  />
                  {major && label && (
                    <text
                      x={xLeft - 3}
                      y={y + 2}
                      textAnchor="end"
                      fontSize="6"
                      fontWeight="600"
                      fill="rgba(255,255,255,0.45)"
                      style={{ 
                        fontFamily: "ui-sans-serif, system-ui, sans-serif", 
                        letterSpacing: "0.2px" 
                      }}
                    >
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* —— 3. 玻璃外壳描边与高光 —— */}
          <path
            d={FLASK_OUTLINE_D}
            fill="none"
            stroke="rgba(226,232,240,0.55)"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d={FLASK_OUTLINE_D}
            fill="none"
            stroke="url(#flaskWallStroke)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M 74 38 L 126 38"
            fill="none"
            stroke="url(#flaskWallStroke)"
            strokeWidth="1.2"
          />

          {/* 左侧高光线 */}
          <path
            d="M 80 40 L 80 93 L 46 205"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* 右侧高光线 */}
          <path
            d="M 120 40 L 120 93 L 148 185"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* 底部高光弧线 */}
          <path
            d="M 54 216 Q 100 224 146 216"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );
}