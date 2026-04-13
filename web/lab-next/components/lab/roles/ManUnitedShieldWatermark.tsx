import { cn } from "@/lib/utils";

/** 原创几何盾牌水印，呼应红魔主色与条纹，非官方队徽 */
export function ManUnitedShieldWatermark({ className }: { className?: string }) {
  return (
    <svg
      className={cn(className)}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M100 8 184 44v72c0 48-38 88-84 116C54 204 16 164 16 116V44L100 8Z"
        fill="white"
        opacity={0.14}
      />
      <path
        d="m100 36 58 24v54c0 38-28 72-58 90-30-18-58-52-58-90V60l58-24Z"
        stroke="#fbbf24"
        strokeOpacity={0.35}
        strokeWidth={3}
      />
      <path
        d="M52 92h96"
        stroke="white"
        strokeOpacity={0.45}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <path
        d="M52 118h96"
        stroke="white"
        strokeOpacity={0.28}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <circle cx={100} cy={168} r={22} fill="white" opacity={0.12} />
    </svg>
  );
}
