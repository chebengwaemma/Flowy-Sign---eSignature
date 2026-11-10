"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const POLL_MS = 2000;

/**
 * While a tab is open, ask the server if an admin save happened.
 * A newer revision refreshes the server render in place — no manual reload.
 */
export function LiveSiteSync({ revision }: { revision: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const seen = useRef(revision);
  const refreshing = useRef(false);

  useEffect(() => {
    if (revision > seen.current) seen.current = revision;
  }, [revision]);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/sign")) return;
    let stopped = false;

    async function tick() {
      if (stopped || refreshing.current || document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/public/live", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { revision?: number };
        if (typeof data.revision !== "number" || data.revision === seen.current) return;
        seen.current = data.revision;
        refreshing.current = true;
        router.refresh();
        window.setTimeout(() => {
          refreshing.current = false;
        }, 1200);
      } catch {
        /* leave the current page up */
      }
    }

    const id = window.setInterval(() => void tick(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname, router]);

  return null;
}

export function useLivePublicSite() {
  const [ready, setReady] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [showGoogle, setShowGoogle] = useState(true);
  const [brandName, setBrandName] = useState("Flowy Sign - eSignature");

  useEffect(() => {
    let last = "";
    let stopped = false;

    async function pull(force = false) {
      if (stopped || (!force && document.visibilityState === "hidden")) return;
      try {
        const res = await fetch("/api/public/site", { cache: "no-store" });
        const data = (await res.json()) as {
          brandName?: string;
          signupEnabled?: boolean;
          showGoogleLogin?: boolean;
        };
        const key = JSON.stringify([data.brandName, data.signupEnabled, data.showGoogleLogin]);
        if (key === last) return;
        last = key;
        setSignupEnabled(data.signupEnabled !== false);
        setShowGoogle(data.showGoogleLogin !== false);
        if (data.brandName) setBrandName(data.brandName);
        setReady(true);
      } catch {
        setReady(true);
      }
    }

    void pull(true);
    const id = window.setInterval(() => void pull(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void pull(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return { ready, signupEnabled, showGoogle, brandName };
}
