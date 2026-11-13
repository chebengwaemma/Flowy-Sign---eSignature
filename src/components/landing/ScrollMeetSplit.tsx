"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { meetTravel } from "./meet-travel";

type ScrollMeetSplitProps = {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  distance?: number;
  stagger?: number;
  scrub?: number | boolean;
};

/**
 * Alternating vertical meet: even items from top, odd from bottom (and reverse on scroll-up).
 */
export function ScrollMeetSplit({
  children,
  className,
  itemClassName,
  distance = 140,
  stagger = 0.08,
  scrub = 1.1,
}: ScrollMeetSplitProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = () =>
      Array.from(root.querySelectorAll<HTMLElement>("[data-meet-item]"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items().forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    let cancelled = false;
    let ctx: { revert: () => void } | null = null;
    let resizeTimer = 0;
    let refreshTimer = 0;
    let onResize: (() => void) | null = null;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !rootRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const play = () => {
        const node = rootRef.current;
        if (!node) return;
        ctx?.revert();
        const travel = meetTravel(distance);

        ctx = gsap.context(() => {
          items().forEach((el, i) => {
            const fromTop = i % 2 === 0;
            el.style.filter = "none";
            el.style.opacity = "1";
            gsap.fromTo(
              el,
              { y: fromTop ? -travel : travel },
              {
                y: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: el,
                  start: `top ${Math.max(78, 90 - i * stagger * 30)}%`,
                  end: "top 45%",
                  scrub,
                  invalidateOnRefresh: true,
                },
              },
            );
          });
          ScrollTrigger.refresh();
        }, node);
      };

      play();
      onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(play, 180);
      };
      window.addEventListener("resize", onResize);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
      window.clearTimeout(resizeTimer);
      if (onResize) window.removeEventListener("resize", onResize);
      ctx?.revert();
    };
  }, [distance, scrub, stagger]);

  const childItems = Children.toArray(children).filter(isValidElement);

  return (
    <div ref={rootRef} className={className} data-scroll-meet-split>
      {childItems.map((child, i) => (
        <div
          key={child.key ?? i}
          data-meet-item
          data-side={i % 2 === 0 ? "top" : "bottom"}
          className={itemClassName}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
