"use client";

import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import type { ReactNode } from "react";

export type WorksProject3DCardProps = {
  name: string;
  desc: string;
  tags: string[];
  icon: ReactNode;
};

/**
 * Works 横向展柜项目卡，结构对齐 Aceternity「3d-card-demo」分层（CardItem + translateZ）。
 */
export function WorksProject3DCard({ name, desc, tags, icon }: WorksProject3DCardProps) {
  return (
    <CardContainer className="inter-var group/tilt h-full w-full" containerClassName="flex h-full w-full items-stretch justify-stretch py-0">
      <CardBody
        className="pointer-events-auto relative flex h-full min-h-[58vh] w-full max-w-none flex-col justify-between rounded-[2.5rem] border border-cyan-200/25 bg-slate-950/72 p-8 shadow-[0_0_50px_rgba(34,211,238,0.12)] ring-1 ring-cyan-300/15 transition-[box-shadow,border-color] duration-500 group-hover/tilt:border-cyan-200/40 group-hover/tilt:shadow-[0_0_70px_rgba(34,211,238,0.22)] [transform-style:preserve-3d] md:min-h-[65vh] md:p-12"
      >
        <div
          className="pointer-events-none absolute -left-16 -top-12 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl"
          aria-hidden
        />

        <CardItem translateZ={100} className="flex w-full items-start justify-between">
          <div className="rounded-2xl border border-white/25 bg-white/10 p-5 shadow-inner">{icon}</div>
        </CardItem>

        <div className="mt-auto">
          <CardItem translateZ={120} as="h3" className="mb-4 w-full text-3xl font-bold text-white md:text-5xl">
            {name}
          </CardItem>
          <CardItem translateZ={90} as="p" className="mb-8 w-full max-w-md text-lg leading-relaxed text-cyan-50/85">
            {desc}
          </CardItem>
          <CardItem translateZ={70} className="flex w-full flex-wrap gap-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/30 bg-black/25 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-cyan-200"
              >
                {tag}
              </span>
            ))}
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}
