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

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 768px)").matches;

    // Mobile: no horizontal slide — it overflows the viewport and clips content.
    if (reduce || narrow) {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.filter = "none";
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const resolved =
      side === "auto"
        ? el.getBoundingClientRect().left < window.innerWidth / 2
          ? "left"
          : "right"
        : side;
    const fromX = resolved === "left" ? -distance : distance;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { x: fromX, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            end: "top 50%",
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
