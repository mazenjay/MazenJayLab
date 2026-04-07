"use client";

/**
 * Magic UI – Icon Cloud (images mode)
 * @see https://magicui.design/docs/components/icon-cloud
 */

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface Icon {
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  id: number;
}

export interface IconCloudProps {
  images: string[];
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function IconCloud({ images, className }: IconCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [iconPositions, setIconPositions] = useState<Icon[]>([]);

  const mousePosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    startTime: number;
    duration: number;
  } | null>(null);

  const iconCanvasesRef = useRef<HTMLCanvasElement[]>([]);
  const imagesLoadedRef = useRef<boolean[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    if (images.length === 0) {
      iconCanvasesRef.current = [];
      imagesLoadedRef.current = [];
      return;
    }

    imagesLoadedRef.current = new Array(images.length).fill(false);
    iconCanvasesRef.current = images.map((url, index) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = 40;
      offscreen.height = 40;
      const offCtx = offscreen.getContext("2d");
      if (offCtx) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => {
          offCtx.clearRect(0, 0, 40, 40);
          offCtx.beginPath();
          offCtx.arc(20, 20, 20, 0, Math.PI * 2);
          offCtx.closePath();
          offCtx.clip();
          offCtx.drawImage(img, 0, 0, 40, 40);
          imagesLoadedRef.current[index] = true;
        };
        img.onerror = () => {
          offCtx.fillStyle = "#e5e7eb";
          offCtx.beginPath();
          offCtx.arc(20, 20, 20, 0, Math.PI * 2);
          offCtx.fill();
          imagesLoadedRef.current[index] = true;
        };
      }
      return offscreen;
    });
  }, [images]);

  useEffect(() => {
    const n = images.length;
    if (n === 0) {
      setIconPositions([]);
      return;
    }
    const newIcons: Icon[] = [];
    const offset = 2 / n;
    const increment = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < n; i++) {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * increment;
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;
      newIcons.push({
        x: x * 100,
        y: y * 100,
        z: z * 100,
        scale: 1,
        opacity: 1,
        id: i,
      });
    }
    setIconPositions(newIcons);
  }, [images]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || iconPositions.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);

      const centerX = cw / 2;
      const centerY = ch / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const mp = mousePosRef.current;
      const dx = mp.x - centerX;
      const dy = mp.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = 0.003 + (distance / maxDistance) * 0.01;

      const tr = targetRotationRef.current;
      if (tr) {
        const elapsed = performance.now() - tr.startTime;
        const progress = Math.min(1, elapsed / tr.duration);
        const eased = easeOutCubic(progress);
        rotationRef.current = {
          x: tr.startX + (tr.x - tr.startX) * eased,
          y: tr.startY + (tr.y - tr.startY) * eased,
        };
        if (progress >= 1) targetRotationRef.current = null;
      } else if (!isDraggingRef.current) {
        rotationRef.current = {
          x: rotationRef.current.x + (dy / ch) * speed,
          y: rotationRef.current.y + (dx / cw) * speed,
        };
      }

      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);

      iconPositions.forEach((icon, index) => {
        const rotatedX = icon.x * cosY - icon.z * sinY;
        const rotatedZ = icon.x * sinY + icon.z * cosY;
        const rotatedY = icon.y * cosX + rotatedZ * sinX;

        const scale = (rotatedZ + 200) / 300;
        const opacity = Math.max(0.2, Math.min(1, (rotatedZ + 150) / 200));

        ctx.save();
        ctx.translate(centerX + rotatedX, centerY + rotatedY);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;

        if (
          iconCanvasesRef.current[index] &&
          imagesLoadedRef.current[index]
        ) {
          ctx.drawImage(iconCanvasesRef.current[index], -20, -20, 40, 40);
        }

        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [iconPositions]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const resize = () => {
      const w = Math.max(1, Math.floor(wrap.clientWidth));
      const h = Math.max(1, Math.floor(wrap.clientHeight));
      canvas.width = w;
      canvas.height = h;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = x * scaleX;
    const py = y * scaleY;

    for (const icon of iconPositions) {
      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);

      const rotatedX = icon.x * cosY - icon.z * sinY;
      const rotatedZ = icon.x * sinY + icon.z * cosY;
      const rotatedY = icon.y * cosX + rotatedZ * sinX;

      const screenX = canvas.width / 2 + rotatedX;
      const screenY = canvas.height / 2 + rotatedY;
      const scale = (rotatedZ + 200) / 300;
      const radius = 20 * scale;
      const dx = px - screenX;
      const dy = py - screenY;

      if (dx * dx + dy * dy < radius * radius) {
        const targetX = -Math.atan2(
          icon.y,
          Math.sqrt(icon.x * icon.x + icon.z * icon.z),
        );
        const targetY = Math.atan2(icon.x, icon.z);
        const curX = rotationRef.current.x;
        const curY = rotationRef.current.y;
        const dist = Math.hypot(targetX - curX, targetY - curY);
        const duration = Math.min(2000, Math.max(800, dist * 1000));
        targetRotationRef.current = {
          x: targetX,
          y: targetY,
          startX: curX,
          startY: curY,
          startTime: performance.now(),
          duration,
        };
        return;
      }
    }

    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      rotationRef.current = {
        x: rotationRef.current.x + deltaY * 0.002,
        y: rotationRef.current.y + deltaX * 0.002,
      };
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const endDrag = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={wrapRef}
      className={cn("relative h-full min-h-[13rem] w-full", className)}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-grab active:cursor-grabbing rounded-xl"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      />
    </div>
  );
}
