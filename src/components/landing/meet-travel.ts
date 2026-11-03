/** Viewport-aware travel for ScrollMeet — motion on mobile, tablet, and desktop. */
export function meetTravel(distance: number): { travel: number; lift: number } {
  if (typeof window === "undefined") {
    return { travel: distance, lift: 0 };
  }
  const w = window.innerWidth;
  if (w <= 640) return { travel: Math.min(Math.abs(distance), 32), lift: 16 };
  if (w <= 1024) return { travel: Math.min(Math.abs(distance), 56), lift: 12 };
  return { travel: distance, lift: 0 };
}
