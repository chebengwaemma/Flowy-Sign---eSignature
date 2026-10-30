"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import {
  FEATURE_LINKS,
  PRICING_LINKS,
  TEAM_LINKS,
  WHY_LINKS,
  type NavLink,
} from "./marketing/nav-data";

type Panel = "why" | "features" | "teams" | "pricing" | null;

function MegaPanel({
  title,
  links,
  onNavigate,
}: {
  title: string;
  links: NavLink[];
  onNavigate: () => void;
}) {
  return (
    <div className="lp-mega-panel" role="region" aria-label={title}>
      <p className="lp-mega-title">{title}</p>
      <div className="lp-mega-grid">
        {links.map((item) => (
          <Link key={item.href + item.title} href={item.href} className="lp-mega-item" onClick={onNavigate}>
            <span className="lp-mega-item-title">{item.title}</span>
            <span className="lp-mega-item-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SiteHeader({
  nav,
  brandLabel = "Flowy Sign - eSignature",
}: {
  nav: {
    why: string;
    features: string;
    teams: string;
    developers: string;
    pricing: string;
    support: string;
    login: string;
    getStarted: string;
  };
  brandLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [mobileExpand, setMobileExpand] = useState<Panel>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setPanel(null);
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 980) {
        setOpen(false);
        setMobileExpand(null);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setPanel(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function togglePanel(id: Panel) {
    setPanel((p) => (p === id ? null : id));
  }

  function closeAll() {
    setOpen(false);
    setPanel(null);
    setMobileExpand(null);
  }

  return (
    <header className={`lp-header${panel ? " lp-header-open" : ""}`} ref={headerRef}>
      <div className="lp-header-inner">
        <div className="lp-header-left">
          <Logo href="/" label={brandLabel} blue light />
          <nav className="lp-nav" aria-label="Primary">
            <button
              type="button"
              className={`lp-nav-btn${panel === "why" ? " on" : ""}`}
              aria-expanded={panel === "why"}
              onClick={() => togglePanel("why")}
            >
              {nav.why} <ChevronDown size={14} />
            </button>
            <button
              type="button"
              className={`lp-nav-btn${panel === "features" ? " on" : ""}`}
              aria-expanded={panel === "features"}
              onClick={() => togglePanel("features")}
            >
              {nav.features} <ChevronDown size={14} />
            </button>
            <button
              type="button"
              className={`lp-nav-btn${panel === "teams" ? " on" : ""}`}
              aria-expanded={panel === "teams"}
              onClick={() => togglePanel("teams")}
            >
              {nav.teams} <ChevronDown size={14} />
            </button>
            <Link href="/developers" className="lp-nav-dev" onClick={closeAll}>
              {nav.developers}
            </Link>
            <button
              type="button"
              className={`lp-nav-btn${panel === "pricing" ? " on" : ""}`}
              aria-expanded={panel === "pricing"}
              onClick={() => togglePanel("pricing")}
            >
              {nav.pricing} <ChevronDown size={14} />
            </button>
          </nav>
        </div>
        <div className="lp-header-actions">
          <Link href="/contact" className="lp-link lp-link-desk">
            {nav.support}
          </Link>
          <Link href="/login" className="lp-link lp-link-desk">
            {nav.login}
          </Link>
          <Link href="/signup" className="lp-btn">
            {nav.getStarted}
          </Link>
          <button
            type="button"
            className="lp-menu-btn"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => {
              setOpen((v) => !v);
              setPanel(null);
            }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {panel === "why" && (
        <div className="lp-mega">
          <div className="lp-mega-inner">
            <MegaPanel title="What you can do" links={WHY_LINKS} onNavigate={closeAll} />
            <MegaPanel title="Use cases" links={TEAM_LINKS} onNavigate={closeAll} />
          </div>
        </div>
      )}
      {panel === "features" && (
        <div className="lp-mega">
          <div className="lp-mega-inner">
            <MegaPanel title={nav.features} links={FEATURE_LINKS} onNavigate={closeAll} />
          </div>
        </div>
      )}
      {panel === "teams" && (
        <div className="lp-mega">
          <div className="lp-mega-inner">
            <MegaPanel title="Built for every team" links={TEAM_LINKS} onNavigate={closeAll} />
          </div>
        </div>
      )}
      {panel === "pricing" && (
        <div className="lp-mega">
          <div className="lp-mega-inner">
            <MegaPanel title="Plans" links={PRICING_LINKS} onNavigate={closeAll} />
          </div>
        </div>
      )}

      {open && (
        <>
          <button type="button" className="lp-menu-backdrop" aria-label="Close menu" onClick={closeAll} />
          <div className="lp-menu-drawer" role="dialog" aria-label="Site menu">
            <div className="lp-menu-acc">
              {(
                [
                  ["why", nav.why, WHY_LINKS],
                  ["features", nav.features, FEATURE_LINKS],
                  ["teams", nav.teams, TEAM_LINKS],
                  ["pricing", nav.pricing, PRICING_LINKS],
                ] as const
              ).map(([id, label, links]) => (
                <div key={id} className="lp-menu-acc-item">
                  <button
                    type="button"
                    className="lp-menu-acc-btn"
                    aria-expanded={mobileExpand === id}
                    onClick={() => setMobileExpand((v) => (v === id ? null : id))}
                  >
                    {label}
                    <ChevronDown size={16} className={mobileExpand === id ? "open" : ""} />
                  </button>
                  {mobileExpand === id && (
                    <div className="lp-menu-acc-links">
                      {links.map((item) => (
                        <Link key={item.href + item.title} href={item.href} onClick={closeAll}>
                          <strong>{item.title}</strong>
                          <span>{item.desc}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Link href="/developers" className="lp-menu-acc-link lp-nav-dev" onClick={closeAll}>
                {nav.developers}
              </Link>
            </div>
            <div className="lp-menu-actions">
              <Link href="/contact" onClick={closeAll}>
                {nav.support}
              </Link>
              <Link href="/login" onClick={closeAll}>
                {nav.login}
              </Link>
              <Link href="/signup" className="lp-btn" onClick={closeAll}>
                {nav.getStarted}
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
