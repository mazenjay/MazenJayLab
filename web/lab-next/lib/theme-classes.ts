/**
 * Tailwind needs full class names at build time; map backend theme_color to classes.
 */
export type ThemeKey =
  | "blue"
  | "emerald"
  | "orange"
  | "purple"
  | "rose"
  | "amber"
  | "cyan"
  | "indigo"
  | "red";

const DEFAULT: ThemeKey = "blue";

export function normalizeTheme(color: string | undefined): ThemeKey {
  const c = (color || "blue").toLowerCase();
  const allowed: ThemeKey[] = [
    "blue",
    "emerald",
    "orange",
    "purple",
    "rose",
    "amber",
    "cyan",
    "indigo",
    "red",
  ];
  return (allowed.includes(c as ThemeKey) ? c : DEFAULT) as ThemeKey;
}

export const themePanel = {
  blue: {
    blurR: "bg-blue-200/20",
    blurL: "bg-blue-100/20",
    icon: "text-blue-500",
    titleHover: "group-hover:text-blue-600",
    badgeWrap: "bg-blue-50 border-blue-100/50",
    dot: "bg-blue-500",
    badgeText: "text-blue-600",
    launchHover: "hover:bg-blue-500 hover:shadow-blue-500/30",
  },
  emerald: {
    blurR: "bg-emerald-200/20",
    blurL: "bg-emerald-100/20",
    icon: "text-emerald-500",
    titleHover: "group-hover:text-emerald-600",
    badgeWrap: "bg-emerald-50 border-emerald-100/50",
    dot: "bg-emerald-500",
    badgeText: "text-emerald-600",
    launchHover: "hover:bg-emerald-500 hover:shadow-emerald-500/30",
  },
  orange: {
    blurR: "bg-orange-200/20",
    blurL: "bg-orange-100/20",
    icon: "text-orange-500",
    titleHover: "group-hover:text-orange-600",
    badgeWrap: "bg-orange-50 border-orange-100/50",
    dot: "bg-orange-500",
    badgeText: "text-orange-600",
    launchHover: "hover:bg-orange-500 hover:shadow-orange-500/30",
  },
  purple: {
    blurR: "bg-purple-200/20",
    blurL: "bg-purple-100/20",
    icon: "text-purple-500",
    titleHover: "group-hover:text-purple-600",
    badgeWrap: "bg-purple-50 border-purple-100/50",
    dot: "bg-purple-500",
    badgeText: "text-purple-600",
    launchHover: "hover:bg-purple-500 hover:shadow-purple-500/30",
  },
  rose: {
    blurR: "bg-rose-200/20",
    blurL: "bg-rose-100/20",
    icon: "text-rose-500",
    titleHover: "group-hover:text-rose-600",
    badgeWrap: "bg-rose-50 border-rose-100/50",
    dot: "bg-rose-500",
    badgeText: "text-rose-600",
    launchHover: "hover:bg-rose-500 hover:shadow-rose-500/30",
  },
  amber: {
    blurR: "bg-amber-200/20",
    blurL: "bg-amber-100/20",
    icon: "text-amber-500",
    titleHover: "group-hover:text-amber-600",
    badgeWrap: "bg-amber-50 border-amber-100/50",
    dot: "bg-amber-500",
    badgeText: "text-amber-600",
    launchHover: "hover:bg-amber-500 hover:shadow-amber-500/30",
  },
  cyan: {
    blurR: "bg-cyan-200/20",
    blurL: "bg-cyan-100/20",
    icon: "text-cyan-500",
    titleHover: "group-hover:text-cyan-600",
    badgeWrap: "bg-cyan-50 border-cyan-100/50",
    dot: "bg-cyan-500",
    badgeText: "text-cyan-600",
    launchHover: "hover:bg-cyan-500 hover:shadow-cyan-500/30",
  },
  indigo: {
    blurR: "bg-indigo-200/20",
    blurL: "bg-indigo-100/20",
    icon: "text-indigo-500",
    titleHover: "group-hover:text-indigo-600",
    badgeWrap: "bg-indigo-50 border-indigo-100/50",
    dot: "bg-indigo-500",
    badgeText: "text-indigo-600",
    launchHover: "hover:bg-indigo-500 hover:shadow-indigo-500/30",
  },
  red: {
    blurR: "bg-red-200/20",
    blurL: "bg-red-100/20",
    icon: "text-red-500",
    titleHover: "group-hover:text-red-600",
    badgeWrap: "bg-red-50 border-red-100/50",
    dot: "bg-red-500",
    badgeText: "text-red-600",
    launchHover: "hover:bg-red-500 hover:shadow-red-500/30",
  },
} as const;
