"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { meetTravel } from "./meet-travel";

type Side = "left" | "right" | "auto";

/** Single block meet/split from one side (scrubbed with scroll) — mobile, tablet, desktop. */
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

    let ctx: gsap.Context | null = null;

    const play = () => {
      ctx?.revert();
      const { travel, lift } = meetTravel(distance);
      const resolved =
        side === "auto"
          ? el.getBoundingClientRect().left < window.innerWidth / 2
            ? "left"
            : "right"
          : side;
      const fromX = resolved === "left" ? -travel : travel;

      ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { x: fromX, y: lift, opacity: 0 },
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
    };

    play();
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(play, 180);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      ctx?.revert();
    };
  }, [distance, scrub, side]);

  return (
    <div ref={ref} className={className} data-scroll-meet-block>
      {children}
    </div>
  );
}
