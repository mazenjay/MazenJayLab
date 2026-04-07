const blueprint1 = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-2 md:row-span-1",
];

export function gridClass(index: number): string {
  if (index < blueprint1.length) return blueprint1[index];
  return "md:col-span-1 md:row-span-1";
}

export function animDelay(index: number): string {
  return `${(index * 0.05).toFixed(2)}s`;
}
