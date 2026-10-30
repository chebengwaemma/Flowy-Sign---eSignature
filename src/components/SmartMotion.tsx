"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Global scroll animations for [data-animate] elements.
 * Values: fade | up | left | right | scale
 * Parent data-animate="stagger" auto-animates children.
 */
export function SmartMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const prepare = () => {
      document.querySelectorAll<HTMLElement>("[data-animate='stagger']").forEach((parent) => {
        Array.from(parent.children).forEach((child, i) => {
          const el = child as HTMLElement;
          if (!el.hasAttribute("data-animate")) {
            el.setAttribute("data-animate", "up");
          }
          if (!el.dataset.delay) {
            el.style.setProperty("--d", `${i * 75}ms`);
          }
        });
      });
    };

    prepare();

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-animate]:not([data-animate='stagger'])")
    );

    if (reduce) {
      nodes.forEach((el) => el.classList.add("in"));
      return;
    }

    // Reset when navigating so re-enter animates
    nodes.forEach((el) => el.classList.remove("in"));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("in");
          io.unobserve(el);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((el) => {
      if (el.dataset.delay) el.style.setProperty("--d", el.dataset.delay);
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        requestAnimationFrame(() => el.classList.add("in"));
      } else {
        io.observe(el);
      }
    });

    const safety = window.setTimeout(() => {
      nodes.forEach((el) => el.classList.add("in"));
    }, 1800);

    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, [pathname]);

  return null;
}
