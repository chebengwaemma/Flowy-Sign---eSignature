"use client";

import {
  Children,
  isValidElement,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type ScrollMeetSplitProps = {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  distance?: number;
  stagger?: number;
  scrub?: number | boolean;
};

/**
 * Each child slides in from alternating sides toward center on scroll-down,
 * and parts outward again on scroll-up (scrubbed).
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

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-meet-item]"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const narrow = window.matchMedia("(max-width: 768px)").matches;
    const travel = narrow ? Math.min(Math.abs(distance), 36) : distance;

    const ctx = gsap.context(() => {
      items.forEach((el, i) => {
        const fromLeft = i % 2 === 0;
        gsap.fromTo(
          el,
          {
            x: fromLeft ? -travel : travel,
            y: narrow ? 14 : 0,
            opacity: 0,
            rotate: narrow ? 0 : fromLeft ? -3 : 3,
          },
          {
            x: 0,
            y: 0,
            opacity: 1,
            rotate: 0,
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
    }, root);

    ScrollTrigger.refresh();
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      window.clearTimeout(t);
      ctx.revert();
    };
  }, [distance, scrub, stagger]);

  const items = Children.toArray(children).filter(isValidElement);

  return (
    <div ref={rootRef} className={className} data-scroll-meet-split>
      {items.map((child, i) => (
        <div
          key={child.key ?? i}
          data-meet-item
          data-side={i % 2 === 0 ? "left" : "right"}
          className={itemClassName}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
