/** Viewport-aware vertical travel for ScrollMeet (top ↔ bottom). */
export function meetTravel(distance: number): number {
  if (typeof window === "undefined") return distance;
  const w = window.innerWidth;
  const abs = Math.abs(distance);
  if (w <= 640) return Math.min(abs, 40);
  if (w <= 1024) return Math.min(abs, 70);
  return abs;
}
