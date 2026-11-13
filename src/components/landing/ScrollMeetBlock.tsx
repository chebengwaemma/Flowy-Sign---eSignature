"use client";

import { useEffect, useRef, type ReactNode } from "react";
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    let cancelled = false;
    let ctx: { revert: () => void } | null = null;
    let resizeTimer = 0;
    let onResize: (() => void) | null = null;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const play = () => {
        const node = ref.current;
        if (!node) return;
        ctx?.revert();
        const travel = meetTravel(distance);

        let fromTop: boolean;
        if (side === "top" || side === "left") fromTop = true;
        else if (side === "bottom" || side === "right") fromTop = false;
        else {
          fromTop = node.getBoundingClientRect().top < window.innerHeight * 0.55;
        }

        node.style.filter = "none";
        node.style.opacity = "1";

        ctx = gsap.context(() => {
          gsap.fromTo(
            node,
            { y: fromTop ? -travel : travel },
            {
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: node,
                start: "top 92%",
                end: "top 52%",
                scrub,
                invalidateOnRefresh: true,
              },
            },
          );
          ScrollTrigger.refresh();
        }, node);
      };

      play();
      onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(play, 180);
      };
      window.addEventListener("resize", onResize);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(resizeTimer);
      if (onResize) window.removeEventListener("resize", onResize);
      ctx?.revert();
    };
  }, [distance, scrub, side]);

  return (
    <div ref={ref} className={className} data-scroll-meet-block>
      {children}
    </div>
  );
}
