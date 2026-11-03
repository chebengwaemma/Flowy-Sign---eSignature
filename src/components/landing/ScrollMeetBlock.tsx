"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Side = "left" | "right" | "auto";

/** Single block meet/split from one side (scrubbed with scroll). */
export function ScrollMeetBlock({
  children,
  className,
  side = "auto",
  distance = 110,
  scrub = 1.1,
}: {
  children: ReactNode;
  className?: string;
  side?: Side;
  distance?: number;
  scrub?: number | boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const narrow = window.matchMedia("(max-width: 768px)").matches;
    // Keep motion on mobile, but cap travel so content does not clip.
    const travel = narrow ? Math.min(Math.abs(distance), 36) : distance;

    const resolved =
      side === "auto"
        ? el.getBoundingClientRect().left < window.innerWidth / 2
          ? "left"
          : "right"
        : side;
    const fromX = resolved === "left" ? -travel : travel;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { x: fromX, y: narrow ? 18 : 0, opacity: 0 },
        {
          x: 0,
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            end: "top 55%",
            scrub,
            invalidateOnRefresh: true,
          },
        },
      );
      ScrollTrigger.refresh();
    }, el);

    return () => ctx.revert();
  }, [distance, scrub, side]);

  return (
    <div ref={ref} className={className} data-scroll-meet-block>
      {children}
    </div>
  );
}
