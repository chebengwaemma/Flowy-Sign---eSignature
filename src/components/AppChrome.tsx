"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";
import type { OrgSettings } from "@/lib/types";

export function AppChrome({
  userName,
  userEmail,
  plan,
  brandName,
  showUpgrade,
  settings,
  children,
}: {
  userName: string;
  userEmail: string;
  plan: string;
  brandName: string;
  showUpgrade: boolean;
  settings: OrgSettings;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Close drawer when resizing up to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <AppHeader
        userName={userName}
        plan={plan}
        brandName={brandName}
        showUpgrade={showUpgrade}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((v) => !v)}
      />
      <div className="app-grid">
        {menuOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <Sidebar
          userEmail={userEmail}
          settings={settings}
          open={menuOpen}
          onNavigate={() => setMenuOpen(false)}
        />
        <main className="app-main">{children}</main>
      </div>
    </>
  );
}
