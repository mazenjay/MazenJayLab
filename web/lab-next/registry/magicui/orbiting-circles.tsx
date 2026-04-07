"use client";

import React, { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export interface OrbitingCirclesProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> {
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  iconSize?: number;
  speed?: number;
  /** 暂停整层（未传 itemPaused 时生效） */
  paused?: boolean;
  /** 与 children 一一对应：仅暂停该项公转，其余继续转（可不同速超车） */
  itemPaused?: boolean[];
  /** 每项一圈耗时（秒），越短越快；未传下标则用 duration/speed */
  itemDurations?: number[];
  /** 弱化轨道线与图标（悬停在另一层时） */
  dimmed?: boolean;
}

export function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 0,
  radius = 160,
  path = true,
  iconSize = 30,
  speed = 1,
  paused = false,
  itemPaused,
  itemDurations,
  dimmed = false,
  ...props
}: OrbitingCirclesProps) {
  const calculatedDuration = duration / speed;
  const childArray = React.Children.toArray(children).filter(Boolean);
  const childCount = childArray.length || 1;
  const usePerItemPause =
    Array.isArray(itemPaused) && itemPaused.length === childCount;

  return (
    <div
      className={cn(
        "pointer-events-none relative size-full",
        className,
      )}
      {...props}
    >
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className={cn(
            "pointer-events-none absolute inset-0 size-full transition-opacity duration-300",
            dimmed && "opacity-[0.28]",
          )}
          aria-hidden
        >
          <circle
            className="stroke-black/10 stroke-[1.5] dark:stroke-white/18"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="7 12"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {childArray.map((child, index) => {
        const angle = (360 / childCount) * index;
        const sec =
          itemDurations?.[index] != null
            ? itemDurations[index]!
            : calculatedDuration;
        const armPaused = usePerItemPause ? !!itemPaused[index] : paused;
        return (
          /* 锚在容器中心（0×0）；内层再用负 margin 让图标中心落在锚点上，公转半径才对 */
          <div
            key={index}
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{ width: 0, height: 0 }}
          >
            <div
              style={
                {
                  "--duration": sec,
                  "--radius": radius,
                  "--angle": angle,
                  "--delay": delay,
                  "--icon-size": `${iconSize}px`,
                  width: "var(--icon-size)",
                  height: "var(--icon-size)",
                  marginLeft: "calc(var(--icon-size) * -0.5)",
                  marginTop: "calc(var(--icon-size) * -0.5)",
                  /* animation 简写会写回 play-state；用行内覆盖才稳定暂停 */
                  animationPlayState: armPaused ? "paused" : "running",
                } as React.CSSProperties
              }
              className={cn(
                "animate-orbit pointer-events-auto flex shrink-0 transform-gpu items-center justify-center rounded-full",
                reverse && "[animation-direction:reverse]",
              )}
            >
              {child}
            </div>
          </div>
        );
      })}
    </div>
  );
}
