"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { meetTravel } from "./meet-travel";

type Side = "left" | "right" | "auto" | "top" | "bottom";

/** Meet/split on the vertical axis: from top or from bottom (scrubbed). */
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
      const travel = meetTravel(distance);

      let fromTop: boolean;
      if (side === "top" || side === "left") fromTop = true;
      else if (side === "bottom" || side === "right") fromTop = false;
      else {
        // auto: above mid-viewport → drop from top; below → rise from bottom
        fromTop = el.getBoundingClientRect().top < window.innerHeight * 0.55;
      }

      const fromY = fromTop ? -travel : travel;

      ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { y: fromY, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 92%",
              end: "top 52%",
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
