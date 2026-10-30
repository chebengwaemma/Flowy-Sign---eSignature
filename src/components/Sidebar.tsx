"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  LayoutTemplate,
  FileText,
  Users,
  Puzzle,
  Code2,
  Printer,
  PenLine,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { BulkSendModal } from "./BulkSendModal";
import type { OrgSettings } from "@/lib/types";

export function Sidebar({
  userEmail,
  settings,
  open = false,
  onNavigate,
}: {
  userEmail: string;
  role?: string;
  settings: OrgSettings;
  open?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [bulkOpen, setBulkOpen] = useState(false);

  const primaryLinks = [
    { href: "/dashboard", label: settings.navHome, icon: Home, enabled: true },
    {
      href: "/templates",
      label: settings.navTemplates,
      icon: LayoutTemplate,
      chevron: true,
      enabled: settings.templatesEnabled,
    },
    {
      href: "/documents",
      label: settings.navDocuments,
      icon: FileText,
      enabled: settings.documentsEnabled,
    },
    {
      href: "/signature-generator",
      label: settings.navSignatureGenerator || "Signature generator",
      icon: PenLine,
      enabled: settings.signatureGeneratorEnabled !== false,
    },
    { href: "/team", label: settings.navTeams, icon: Users, enabled: settings.teamEnabled },
    {
      href: "/integrations",
      label: settings.navIntegrations,
      icon: Puzzle,
      enabled: settings.integrationsEnabled,
    },
    { href: "/api-docs", label: settings.navApi, icon: Code2, enabled: settings.apiEnabled },
    { href: "/fax", label: settings.navFax, icon: Printer, enabled: settings.faxEnabled },
  ].filter((l) => l.enabled);

  function go() {
    onNavigate?.();
  }

  return (
    <>
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="flex flex-col gap-2 px-1">
          {settings.documentsEnabled && (
            <Link href="/documents/new" className="btn-sign" onClick={go}>
              {settings.signButtonLabel}
            </Link>
          )}
          {settings.bulkSendEnabled && (
            <button
              type="button"
              className="btn-bulk"
              onClick={() => {
                setBulkOpen(true);
                onNavigate?.();
              }}
            >
              {settings.bulkButtonLabel}
            </button>
          )}
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-0.5">
          {primaryLinks.map(({ href, label, icon: Icon, chevron }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link ${active ? "active" : ""}`}
                onClick={go}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span className="flex-1">{label}</span>
                {chevron && <ChevronDown size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-[#ebe8e5] pt-3">
          {settings.billingEnabled && (
            <Link href="/billing" className="nav-link !text-[13px]" onClick={go}>
              {settings.navPricing}
            </Link>
          )}
          <Link href="/dashboard" className="nav-link !text-[13px]" onClick={go}>
            {settings.navProducts}
          </Link>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="nav-link w-full !text-[13px]">
              <LogOut size={15} />
              <span className="flex-1 text-left">Sign out</span>
            </button>
          </form>
          <p className="truncate px-3 pt-1 text-[11px] text-[#8a847d]" title={userEmail}>
            {userEmail}
          </p>
        </div>
      </aside>

      <BulkSendModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={settings.bulkModalTitle}
        body={settings.bulkModalBody}
      />
    </>
  );
}
