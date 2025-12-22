export function polar(i: number, n: number, r: number) {
  const a = (i / Math.max(1, n)) * Math.PI * 2;
  return [Math.cos(a) * r, 0, Math.sin(a) * r] as const;
}

