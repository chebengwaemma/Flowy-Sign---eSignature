"use client";

import Link from "next/link";
import { CircleHelp, Menu, X } from "lucide-react";
import { Logo } from "./Logo";

export function AppHeader({
  userName,
  plan,
  brandName,
  showUpgrade,
  menuOpen,
  onMenuToggle,
}: {
  userName: string;
  plan: string;
  brandName: string;
  showUpgrade: boolean;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
}) {
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="app-topbar">
      <div className="flex min-w-0 items-center gap-2">
        {onMenuToggle && (
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={onMenuToggle}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        <Logo href="/dashboard" compact label={brandName} />
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {showUpgrade && plan !== "business" && (
          <Link href="/billing" className="btn-upgrade">
            <span aria-hidden>↗</span> <span className="upgrade-label">Upgrade</span>
          </Link>
        )}
        <button type="button" className="icon-btn" aria-label="Help" title="Help">
          <CircleHelp size={18} />
        </button>
        <div className="avatar" title={userName}>
          {initials}
        </div>
      </div>
    </header>
  );
}
