"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import {
  AdminSectionBanner,
  AdminStickySave,
  SECTION_META,
} from "@/components/admin/AdminEditorChrome";
import { MarketingCmsExtra } from "@/components/admin/MarketingCmsExtra";
import type { MarketingSite, PageHero } from "@/lib/marketing";
import { withSyncedPlanFeatures } from "@/lib/plans";
import { mergeSettings } from "@/lib/settings";
import type { DocStatus, OrgSettings, PlanDefinition, PlanId, Role } from "@/lib/types";
import { formatDate, statusTone } from "@/lib/utils";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: PlanId;
  createdAt: string;
};

type AdminDoc = {
  id: string;
  title: string;
  status: DocStatus;
  updatedAt: string;
  recipients: { email: string }[];
};

const CONTROL_MAP: {
  group: string;
  items: { id: string; title: string; controls: string; preview?: string }[];
}[] = [
  {
    group: "Website / Marketing",
    items: [
      { id: "A", title: "Appearance & brand", controls: "Brand name, logo, colors, address", preview: "/" },
      { id: "L", title: "Homepage copy", controls: "Hero, pillars, stories, tools CTAs", preview: "/" },
      { id: "M", title: "Page heroes", controls: "Why / Features / Teams / Help / About…", preview: "/why" },
      { id: "N", title: "Nav & footer menu", controls: "Public header + footer links", preview: "/" },
      { id: "O", title: "Steps / teams / API", controls: "Homepage steps & team cards", preview: "/#teams" },
      { id: "P", title: "FAQs", controls: "Help page questions", preview: "/help" },
      { id: "Q", title: "Privacy & Terms", controls: "Legal page body text", preview: "/privacy" },
      { id: "R", title: "About / Contact / Press", controls: "Card grids on those pages", preview: "/about" },
      { id: "S", title: "Feature pages", controls: "Each /features/[slug] page", preview: "/features" },
      { id: "T", title: "Team pages", controls: "Each /teams/[slug] page", preview: "/teams" },
      { id: "W", title: "Pricing page & plans", controls: "Full /pricing + plan quotas + Stripe IDs", preview: "/pricing" },
    ],
  },
  {
    group: "App product",
    items: [
      { id: "B", title: "Billing visibility", controls: "Show billing / upgrade in app" },
      { id: "C", title: "Chatbot", controls: "Enable, name, greeting" },
      { id: "D", title: "Documents defaults", controls: "Default title, max signers" },
      { id: "E", title: "Email & support", controls: "Support email" },
      { id: "F", title: "Features & modules", controls: "Fax, templates, API, team toggles" },
      { id: "G", title: "Maintenance", controls: "Site maintenance mode" },
      { id: "H", title: "Website hero (quick)", controls: "Public homepage hero shortcuts", preview: "/" },
      { id: "I", title: "Interface labels", controls: "Sign / bulk button labels" },
      { id: "J", title: "Bulk send modal", controls: "Upgrade modal copy" },
      { id: "K", title: "App nav labels", controls: "Logged-in sidebar labels" },
      { id: "V", title: "Signature generator", controls: "Sidebar + free downloads" },
      { id: "X", title: "Auth & signup", controls: "Public signup + Google login" },
      { id: "Y", title: "Send rules", controls: "Free send limit, modules" },
    ],
  },
  {
    group: "Users & documents",
    items: [
      { id: "U", title: "Users control", controls: "Change any user plan / role" },
      { id: "Z", title: "Documents control", controls: "Admin document list / status" },
    ],
  },
];

const MENU_GROUPS = [
  {
    id: "control",
    title: "All control",
    items: [{ id: "hub", title: "Control center" }],
  },
  {
    id: "website",
    title: "Website / Marketing",
    items: [
      { id: "A", title: "Appearance & brand" },
      { id: "L", title: "Homepage copy" },
      { id: "M", title: "Page heroes" },
      { id: "N", title: "Nav & footer menu" },
      { id: "O", title: "Steps / teams / API" },
      { id: "P", title: "FAQs" },
      { id: "Q", title: "Privacy & Terms" },
      { id: "R", title: "About / Contact / Press" },
      { id: "S", title: "Feature pages" },
      { id: "T", title: "Team pages" },
      { id: "W", title: "Pricing page & plans" },
    ],
  },
  {
    id: "app",
    title: "App settings",
    items: [
      { id: "B", title: "Billing visibility" },
      { id: "C", title: "Chatbot" },
      { id: "D", title: "Documents defaults" },
      { id: "E", title: "Email & support" },
      { id: "F", title: "Features & modules" },
      { id: "G", title: "Maintenance" },
      { id: "H", title: "Website hero (quick)" },
      { id: "I", title: "Interface labels" },
      { id: "J", title: "Bulk send modal" },
      { id: "K", title: "App nav labels" },
      { id: "V", title: "Signature generator" },
      { id: "X", title: "Auth & signup" },
      { id: "Y", title: "Send rules" },
    ],
  },
  {
    id: "people",
    title: "Users & documents",
    items: [
      { id: "U", title: "Users control" },
      { id: "Z", title: "Documents control" },
    ],
  },
] as const;

type SectionId = (typeof MENU_GROUPS)[number]["items"][number]["id"];

const ALL_SECTIONS: { id: SectionId; title: string }[] = MENU_GROUPS.flatMap((g) =>
  g.items.map((item) => ({ id: item.id as SectionId, title: item.title })),
);

export function AdminPanel({
  settings,
  orgName,
  users,
  documents,
}: {
  settings: OrgSettings;
  orgName: string;
  users: AdminUser[];
  documents: AdminDoc[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => mergeSettings(settings || null));
  const [section, setSection] = useState<SectionId>("hub");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    control: true,
    website: true,
    app: true,
    people: true,
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [localUsers, setLocalUsers] = useState(users);
  const [localDocs, setLocalDocs] = useState(documents);

  const activeTitle = ALL_SECTIONS.find((s) => s.id === section)?.title || "Settings";

  function goSection(id: SectionId) {
    setSection(id);
    setMobileMenu(false);
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  useEffect(() => {
    if (!mobileMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenu(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenu]);

  function set<K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setHomeField<K extends keyof MarketingSite["home"]>(key: K, value: MarketingSite["home"][K]) {
    setForm((prev) => ({
      ...prev,
      marketing: {
        ...prev.marketing,
        home: { ...prev.marketing.home, [key]: value },
      },
    }));
  }

  function setHero(page: keyof Pick<
    MarketingSite,
    "why" | "features" | "teams" | "developers" | "pricing" | "help" | "about" | "contact" | "press" | "privacy" | "terms"
  >, key: keyof PageHero, value: string) {
    setForm((prev) => ({
      ...prev,
      marketing: {
        ...prev.marketing,
        [page]: { ...prev.marketing[page], [key]: value },
      },
    }));
  }

  function setMktNav<K extends "navWhy" | "navFeatures" | "navTeams" | "navDevelopers" | "navPricing" | "navSupport" | "navLogin" | "navGetStarted" | "footerTagline">(
    key: K,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      marketing: { ...prev.marketing, [key]: value },
    }));
  }

  function setFooterLink(index: number, key: "label" | "href", value: string) {
    setForm((prev) => {
      const footerLinks = prev.marketing.footerLinks.map((link, i) =>
        i === index ? { ...link, [key]: value } : link,
      );
      return { ...prev, marketing: { ...prev.marketing, footerLinks } };
    });
  }

  function addFooterLink() {
    setForm((prev) => ({
      ...prev,
      marketing: {
        ...prev.marketing,
        footerLinks: [...prev.marketing.footerLinks, { label: "New link", href: "/" }],
      },
    }));
  }

  function removeFooterLink(index: number) {
    setForm((prev) => ({
      ...prev,
      marketing: {
        ...prev.marketing,
        footerLinks: prev.marketing.footerLinks.filter((_, i) => i !== index),
      },
    }));
  }

  const toggles = useMemo(
    () =>
      [
        ["chatbotEnabled", "Chatbot"],
        ["faxEnabled", "Fax"],
        ["templatesEnabled", "Templates"],
        ["integrationsEnabled", "Integrations"],
        ["apiEnabled", "API"],
        ["teamEnabled", "Teams"],
        ["billingEnabled", "Billing / pricing"],
        ["documentsEnabled", "Documents"],
        ["bulkSendEnabled", "Bulk send button"],
        ["signatureGeneratorEnabled", "Signature generator"],
        ["showUpgradeButton", "Upgrade button"],
        ["allowMemberInvites", "Member invites"],
        ["signupEnabled", "Public signup"],
        ["showGoogleLogin", "Google login button"],
        ["maintenanceMode", "Maintenance mode"],
      ] as const,
    [],
  );

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const starter = form.plans?.find((p) => p.id === "starter");
    // Keep legacy landing* fields in sync with the real website hero (marketing.home)
    const home = {
      ...form.marketing.home,
      ...(starter
        ? {
            planTeamPrice: String(starter.monthly),
            planTeamTitle: starter.name,
          }
        : null),
    };
    const payload = {
      ...form,
      landingHeadline: home.heroTitle,
      landingSubhead: home.heroLead,
      landingCta: home.heroCta,
      marketing: {
        ...form.marketing,
        home,
      },
    };
    setForm(payload);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage("Could not save settings");
      return;
    }
    setMessage("Saved. Open Home / Pricing / Billing in a new tab (or hard-refresh) to see updates.");
    router.refresh();
  }

  async function patchUser(userId: string, patch: Partial<AdminUser>) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...patch }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.user) {
      setLocalUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u)));
      router.refresh();
    }
  }

  async function removeUser(userId: string) {
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setLocalUsers((prev) => prev.filter((u) => u.id !== userId));
      router.refresh();
    }
  }

  async function patchDoc(documentId: string, patch: Record<string, unknown>) {
    const res = await fetch("/api/admin/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, ...patch }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    if (patch.delete) {
      setLocalDocs((prev) => prev.filter((d) => d.id !== documentId));
    } else if (data?.document) {
      setLocalDocs((prev) => prev.map((d) => (d.id === documentId ? { ...d, ...data.document } : d)));
    }
    router.refresh();
  }

  const nav = (
    <aside className="admin-nav">
      <p className="admin-nav-title">Admin menu</p>
      {MENU_GROUPS.map((group) => (
        <div key={group.id} className="admin-nav-group">
          <button
            type="button"
            className="admin-nav-group-btn"
            aria-expanded={openGroups[group.id]}
            onClick={() => toggleGroup(group.id)}
          >
            <span>{group.title}</span>
            <span className="admin-nav-chevron">{openGroups[group.id] ? "−" : "+"}</span>
          </button>
          {openGroups[group.id] && (
            <div className="admin-nav-group-items">
              {group.items.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`admin-nav-item ${section === s.id ? "active" : ""}`}
                  onClick={() => goSection(s.id)}
                >
                  <span className="admin-letter">{s.id}</span>
                  {s.title}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );

  return (
    <div className="admin-shell">
      <div className="admin-nav-desk">{nav}</div>

      <div className="admin-main">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3">
          <div className="min-w-0 text-sm text-[var(--muted)]">
            <strong className="text-ink">{activeTitle}</strong>
            <span className="mx-2 hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              Workspace: <strong className="text-ink">{orgName}</strong>
            </span>
          </div>
          <button
            type="button"
            className="admin-menu-toggle btn btn-primary"
            aria-expanded={mobileMenu}
            aria-label="Open admin menu"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={18} />
            Menu
          </button>
        </div>

        {mobileMenu && (
          <div className="admin-nav-mobile" role="dialog" aria-modal="true" aria-label="Admin menu">
            <button type="button" className="admin-nav-backdrop" aria-label="Close menu" onClick={() => setMobileMenu(false)} />
            <div className="admin-nav-drawer">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <p className="admin-nav-title !pb-0">Admin menu</p>
                <button type="button" className="btn" aria-label="Close" onClick={() => setMobileMenu(false)}>
                  <X size={18} />
                </button>
              </div>
              {nav}
            </div>
          </div>
        )}

        {section === "hub" && (
          <div className="space-y-6">
            <Section title="All control — website & app (A–Z)">
              <p className="md:col-span-2 text-sm text-muted">
                Every section has a detailed editor like Pricing: what it controls, a Preview button, and a sticky{" "}
                <strong>Save</strong> at the bottom. Open from the map → edit → Save → Preview (hard refresh).
              </p>
              {CONTROL_MAP.map((group) => (
                <div key={group.group} className="md:col-span-2 space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#0b3d38]">{group.group}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[var(--line)] bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-ink">
                              <span className="admin-letter mr-1">{item.id}</span>
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs text-muted">{item.controls}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => goSection(item.id as SectionId)}
                          >
                            Open editor
                          </button>
                          {item.preview && (
                            <a
                              className="btn"
                              href={item.preview}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Preview
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          </div>
        )}

        {section !== "U" && section !== "Z" && section !== "hub" && (
          <form onSubmit={saveSettings} className="space-y-5">
            {SECTION_META[section] && (
              <AdminSectionBanner
                letter={section}
                title={SECTION_META[section].title}
                controls={SECTION_META[section].controls}
                preview={SECTION_META[section].preview}
              />
            )}
            {section === "A" && (
              <Section title="Appearance & brand">
                <p className="text-sm text-muted">
                  Brand name / logo text update header &amp; footer. Colors update the marketing site theme and the logged-in app.
                </p>
                <Field label="Brand name" value={form.brandName} onChange={(v) => set("brandName", v)} />
                <Field label="Logo text" value={form.logoText} onChange={(v) => set("logoText", v)} />
                <Field
                  label="Legal / website name"
                  value={form.companyLegalName}
                  onChange={(v) => set("companyLegalName", v)}
                />
                <Field
                  label="Company address"
                  value={form.companyAddress}
                  onChange={(v) => set("companyAddress", v)}
                />
                <Area label="About us text" value={form.aboutText} onChange={(v) => set("aboutText", v)} />
                <Field label="Primary color" value={form.primaryColor} onChange={(v) => set("primaryColor", v)} type="color-text" />
                <Field label="Accent color" value={form.accentColor} onChange={(v) => set("accentColor", v)} type="color-text" />
                <Field label="Signal / CTA color" value={form.signalColor} onChange={(v) => set("signalColor", v)} type="color-text" />
              </Section>
            )}

            {section === "B" && (
              <Section title="Billing visibility">
                <Toggle
                  label="Show billing / pricing in navigation"
                  checked={form.billingEnabled}
                  onChange={(v) => set("billingEnabled", v)}
                />
                <Toggle
                  label="Show Upgrade button in header"
                  checked={form.showUpgradeButton}
                  onChange={(v) => set("showUpgradeButton", v)}
                />
              </Section>
            )}

            {section === "C" && (
              <Section title="Chatbot">
                <Toggle label="Enable chatbot" checked={form.chatbotEnabled} onChange={(v) => set("chatbotEnabled", v)} />
                <Field label="Chatbot name" value={form.chatbotName} onChange={(v) => set("chatbotName", v)} />
                <Area label="Greeting message" value={form.chatbotGreeting} onChange={(v) => set("chatbotGreeting", v)} />
              </Section>
            )}

            {section === "D" && (
              <Section title="Documents defaults">
                <Field label="Default document title" value={form.defaultDocTitle} onChange={(v) => set("defaultDocTitle", v)} />
                <Field
                  label="Max signers per request"
                  value={String(form.maxSigners)}
                  onChange={(v) => set("maxSigners", Number(v) || 1)}
                />
                <Toggle label="Documents module enabled" checked={form.documentsEnabled} onChange={(v) => set("documentsEnabled", v)} />
              </Section>
            )}

            {section === "E" && (
              <Section title="Email & support">
                <Field label="Support email" value={form.supportEmail} onChange={(v) => set("supportEmail", v)} />
              </Section>
            )}

            {section === "F" && (
              <Section title="Features & modules">
                <div className="grid gap-2 sm:grid-cols-2">
                  {toggles.map(([key, label]) => (
                    <Toggle key={key} label={label} checked={form[key]} onChange={(v) => set(key, v)} />
                  ))}
                </div>
              </Section>
            )}

            {section === "G" && (
              <Section title="General / maintenance">
                <Toggle label="Maintenance mode" checked={form.maintenanceMode} onChange={(v) => set("maintenanceMode", v)} />
                <Area
                  label="Maintenance message"
                  value={form.maintenanceMessage}
                  onChange={(v) => set("maintenanceMessage", v)}
                />
              </Section>
            )}

            {section === "H" && (
              <Section title="Home & landing copy (public website hero)">
                <p className="text-sm text-muted">
                  These fields update the real homepage hero at <strong>/</strong>. (Section L has the same hero fields plus more homepage blocks.)
                </p>
                <Field
                  label="Website hero title"
                  value={form.marketing.home.heroTitle}
                  onChange={(v) => {
                    setHomeField("heroTitle", v);
                    set("landingHeadline", v);
                  }}
                />
                <Area
                  label="Website hero lead"
                  value={form.marketing.home.heroLead}
                  onChange={(v) => {
                    setHomeField("heroLead", v);
                    set("landingSubhead", v);
                  }}
                />
                <Field
                  label="Website hero CTA"
                  value={form.marketing.home.heroCta}
                  onChange={(v) => {
                    setHomeField("heroCta", v);
                    set("landingCta", v);
                  }}
                />
                <Field
                  label="Hero secondary button"
                  value={form.marketing.home.heroSecondary}
                  onChange={(v) => setHomeField("heroSecondary", v)}
                />
                <Field
                  label="App home greeting suffix (dashboard only)"
                  value={form.homeGreetingSuffix}
                  onChange={(v) => set("homeGreetingSuffix", v)}
                />
              </Section>
            )}

            {section === "I" && (
              <Section title="Interface labels">
                <Field label="Sign documents button" value={form.signButtonLabel} onChange={(v) => set("signButtonLabel", v)} />
                <Field label="Bulk send button" value={form.bulkButtonLabel} onChange={(v) => set("bulkButtonLabel", v)} />
              </Section>
            )}

            {section === "J" && (
              <Section title="Bulk send modal">
                <Toggle label="Show bulk send button" checked={form.bulkSendEnabled} onChange={(v) => set("bulkSendEnabled", v)} />
                <Field label="Modal title" value={form.bulkModalTitle} onChange={(v) => set("bulkModalTitle", v)} />
                <Area label="Modal body" value={form.bulkModalBody} onChange={(v) => set("bulkModalBody", v)} />
              </Section>
            )}

            {section === "K" && (
              <Section title="App sidebar labels (logged-in product)">
                <p className="text-sm text-muted">
                  These change the <strong>app sidebar after login</strong> — not the public marketing header.
                  Public nav is section <strong>N · Marketing nav &amp; footer</strong>.
                </p>
                <Field label="Home" value={form.navHome} onChange={(v) => set("navHome", v)} />
                <Field label="Templates" value={form.navTemplates} onChange={(v) => set("navTemplates", v)} />
                <Field label="Documents" value={form.navDocuments} onChange={(v) => set("navDocuments", v)} />
                <Field
                  label="Signature generator"
                  value={form.navSignatureGenerator}
                  onChange={(v) => set("navSignatureGenerator", v)}
                />
                <Field label="Teams" value={form.navTeams} onChange={(v) => set("navTeams", v)} />
                <Field label="Integrations" value={form.navIntegrations} onChange={(v) => set("navIntegrations", v)} />
                <Field label="API" value={form.navApi} onChange={(v) => set("navApi", v)} />
                <Field label="Fax" value={form.navFax} onChange={(v) => set("navFax", v)} />
                <Field label="Pricing" value={form.navPricing} onChange={(v) => set("navPricing", v)} />
                <Field label="Products" value={form.navProducts} onChange={(v) => set("navProducts", v)} />
                <Field label="Admin" value={form.navAdmin} onChange={(v) => set("navAdmin", v)} />
              </Section>
            )}

            {section === "L" && (
              <>
                <Section title="1 · Hero">
                  <Field label="Hero title" value={form.marketing.home.heroTitle} onChange={(v) => setHomeField("heroTitle", v)} />
                  <Area label="Hero lead" value={form.marketing.home.heroLead} onChange={(v) => setHomeField("heroLead", v)} />
                  <Field label="Hero CTA" value={form.marketing.home.heroCta} onChange={(v) => setHomeField("heroCta", v)} />
                  <Field label="Hero secondary" value={form.marketing.home.heroSecondary} onChange={(v) => setHomeField("heroSecondary", v)} />
                  <Field label="Stars label" value={form.marketing.home.starsLabel} onChange={(v) => setHomeField("starsLabel", v)} />
                </Section>
                <Section title="2 · Integrations block">
                  <Field label="Kicker" value={form.marketing.home.integKicker} onChange={(v) => setHomeField("integKicker", v)} />
                  <Field label="Title" value={form.marketing.home.integTitle} onChange={(v) => setHomeField("integTitle", v)} />
                  <Area label="Sub" value={form.marketing.home.integSub} onChange={(v) => setHomeField("integSub", v)} />
                  <Field label="Link label" value={form.marketing.home.integLink} onChange={(v) => setHomeField("integLink", v)} />
                </Section>
                <Section title="3 · Feature pillars">
                  <Field label="Section title" value={form.marketing.home.featuresTitle} onChange={(v) => setHomeField("featuresTitle", v)} />
                  <Field label="Pillar link label" value={form.marketing.home.pillarLinkLabel} onChange={(v) => setHomeField("pillarLinkLabel", v)} />
                  {([1, 2, 3, 4] as const).map((n) => (
                    <div key={n} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-2">
                      <p className="md:col-span-2 text-sm font-bold text-[#0b3d38]">Pillar {n}</p>
                      <Field
                        label="Title"
                        value={form.marketing.home[`pillar${n}Title`]}
                        onChange={(v) => setHomeField(`pillar${n}Title`, v)}
                      />
                      <Area
                        label="Body"
                        value={form.marketing.home[`pillar${n}Body`]}
                        onChange={(v) => setHomeField(`pillar${n}Body`, v)}
                      />
                    </div>
                  ))}
                </Section>
                <Section title="4 · Teams teaser">
                  <Field label="Title" value={form.marketing.home.teamsTitle} onChange={(v) => setHomeField("teamsTitle", v)} />
                  <Area label="Sub" value={form.marketing.home.teamsSub} onChange={(v) => setHomeField("teamsSub", v)} />
                  <Field label="Card link label" value={form.marketing.home.teamLinkLabel} onChange={(v) => setHomeField("teamLinkLabel", v)} />
                  <p className="md:col-span-2 text-xs text-muted">Team card content is edited in section O.</p>
                </Section>
                <Section title="5 · Steps">
                  <Field label="Title" value={form.marketing.home.stepsTitle} onChange={(v) => setHomeField("stepsTitle", v)} />
                  <Area label="Sub" value={form.marketing.home.stepsSub} onChange={(v) => setHomeField("stepsSub", v)} />
                  <p className="md:col-span-2 text-xs text-muted">Step cards are edited in section O.</p>
                </Section>
                <Section title="6 · Tools / API CTA">
                  <Field label="Title" value={form.marketing.home.toolsTitle} onChange={(v) => setHomeField("toolsTitle", v)} />
                  <Area label="Body" value={form.marketing.home.toolsBody} onChange={(v) => setHomeField("toolsBody", v)} />
                  <Field label="Primary CTA" value={form.marketing.home.toolsPrimaryCta} onChange={(v) => setHomeField("toolsPrimaryCta", v)} />
                  <Field label="Primary URL" value={form.marketing.home.toolsPrimaryHref} onChange={(v) => setHomeField("toolsPrimaryHref", v)} />
                  <Field label="Secondary CTA" value={form.marketing.home.toolsSecondaryCta} onChange={(v) => setHomeField("toolsSecondaryCta", v)} />
                  <Field label="Secondary URL" value={form.marketing.home.toolsSecondaryHref} onChange={(v) => setHomeField("toolsSecondaryHref", v)} />
                </Section>
                <Section title="7 · Plans teaser (home)">
                  <Field label="Section title" value={form.marketing.home.plansTitle} onChange={(v) => setHomeField("plansTitle", v)} />
                  <Field label="Team plan title" value={form.marketing.home.planTeamTitle} onChange={(v) => setHomeField("planTeamTitle", v)} />
                  <Field label="Team plan price" value={form.marketing.home.planTeamPrice} onChange={(v) => setHomeField("planTeamPrice", v)} />
                  <Area label="Team plan body" value={form.marketing.home.planTeamBody} onChange={(v) => setHomeField("planTeamBody", v)} />
                  <Field label="API plan title" value={form.marketing.home.planApiTitle} onChange={(v) => setHomeField("planApiTitle", v)} />
                  <Field label="API plan price" value={form.marketing.home.planApiPrice} onChange={(v) => setHomeField("planApiPrice", v)} />
                  <Area label="API plan body" value={form.marketing.home.planApiBody} onChange={(v) => setHomeField("planApiBody", v)} />
                  <p className="md:col-span-2 text-xs text-muted">Full /pricing control is in section W.</p>
                </Section>
                <Section title="8 · Stories + bottom CTA">
                  <Field label="Stories title" value={form.marketing.home.storiesTitle} onChange={(v) => setHomeField("storiesTitle", v)} />
                  <Field label="Bottom CTA title" value={form.marketing.home.bottomTitle} onChange={(v) => setHomeField("bottomTitle", v)} />
                  {([1, 2, 3] as const).map((n) => (
                    <div key={n} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-2">
                      <p className="md:col-span-2 text-sm font-bold text-[#0b3d38]">Story {n}</p>
                      <Field
                        label="Metric"
                        value={form.marketing.home[`story${n}Metric`]}
                        onChange={(v) => setHomeField(`story${n}Metric`, v)}
                      />
                      <Field
                        label="By"
                        value={form.marketing.home[`story${n}By`]}
                        onChange={(v) => setHomeField(`story${n}By`, v)}
                      />
                      <Area
                        label="Quote"
                        value={form.marketing.home[`story${n}Quote`]}
                        onChange={(v) => setHomeField(`story${n}Quote`, v)}
                      />
                    </div>
                  ))}
                </Section>
              </>
            )}

            {section === "M" && (
              <Section title="Marketing page heroes (every public page)">
                <p className="md:col-span-2 text-sm text-muted">
                  Each card = one website page hero. Pricing layout extras are also in <strong>W</strong>.
                </p>
                {(
                  [
                    ["why", "Why", "/why"],
                    ["features", "Features", "/features"],
                    ["teams", "Teams", "/teams"],
                    ["developers", "Developers", "/developers"],
                    ["pricing", "Pricing", "/pricing"],
                    ["help", "Help", "/help"],
                    ["about", "About", "/about"],
                    ["contact", "Contact", "/contact"],
                    ["press", "Press", "/press"],
                    ["privacy", "Privacy", "/privacy"],
                    ["terms", "Terms", "/terms"],
                  ] as const
                ).map(([key, label, href]) => (
                  <div key={key} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-2">
                    <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#0b3d38]">{label}</p>
                      <a className="text-sm font-semibold text-accent-deep" href={href} target="_blank" rel="noreferrer">
                        Preview {href}
                      </a>
                    </div>
                    <Field label="Kicker" value={form.marketing[key].kicker} onChange={(v) => setHero(key, "kicker", v)} />
                    <Field label="Title" value={form.marketing[key].title} onChange={(v) => setHero(key, "title", v)} />
                    <Area label="Lead" value={form.marketing[key].lead} onChange={(v) => setHero(key, "lead", v)} />
                    <Field label="CTA" value={form.marketing[key].cta} onChange={(v) => setHero(key, "cta", v)} />
                    <Field label="Secondary" value={form.marketing[key].secondary} onChange={(v) => setHero(key, "secondary", v)} />
                  </div>
                ))}
              </Section>
            )}

            {section === "N" && (
              <Section title="Marketing nav & footer">
                <Field label="Nav · Why" value={form.marketing.navWhy} onChange={(v) => setMktNav("navWhy", v)} />
                <Field label="Nav · Features" value={form.marketing.navFeatures} onChange={(v) => setMktNav("navFeatures", v)} />
                <Field label="Nav · Teams" value={form.marketing.navTeams} onChange={(v) => setMktNav("navTeams", v)} />
                <Field label="Nav · Developers" value={form.marketing.navDevelopers} onChange={(v) => setMktNav("navDevelopers", v)} />
                <Field label="Nav · Pricing" value={form.marketing.navPricing} onChange={(v) => setMktNav("navPricing", v)} />
                <Field label="Nav · Support" value={form.marketing.navSupport} onChange={(v) => setMktNav("navSupport", v)} />
                <Field label="Nav · Log in" value={form.marketing.navLogin} onChange={(v) => setMktNav("navLogin", v)} />
                <Field label="Nav · Get started" value={form.marketing.navGetStarted} onChange={(v) => setMktNav("navGetStarted", v)} />
                <p className="md:col-span-2 text-sm font-bold text-[#0b3d38]">
                  Footer links (About Us · Pricing · Contact · Terms — add more anytime)
                </p>
                <p className="md:col-span-2 text-xs text-[var(--muted)]">
                  Site name &amp; address come from Appearance: Brand name + Company address (Austell GA, USA).
                </p>
                {form.marketing.footerLinks.map((link, i) => (
                  <div key={i} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
                    <Field label="Label" value={link.label} onChange={(v) => setFooterLink(i, "label", v)} />
                    <Field label="URL" value={link.href} onChange={(v) => setFooterLink(i, "href", v)} />
                    <div className="flex items-end">
                      <button type="button" className="btn" onClick={() => removeFooterLink(i)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="md:col-span-2">
                  <button type="button" className="btn btn-primary" onClick={addFooterLink}>
                    Add footer link
                  </button>
                </div>
              </Section>
            )}

            {section === "O" && (
              <MarketingCmsExtra
                mode="lists"
                marketing={form.marketing}
                onChange={(marketing) => setForm((prev) => ({ ...prev, marketing }))}
              />
            )}
            {section === "P" && (
              <MarketingCmsExtra
                mode="faqs"
                marketing={form.marketing}
                onChange={(marketing) => setForm((prev) => ({ ...prev, marketing }))}
              />
            )}
            {section === "Q" && (
              <MarketingCmsExtra
                mode="legal"
                marketing={form.marketing}
                onChange={(marketing) => setForm((prev) => ({ ...prev, marketing }))}
              />
            )}
            {section === "R" && (
              <MarketingCmsExtra
                mode="cards"
                marketing={form.marketing}
                onChange={(marketing) => setForm((prev) => ({ ...prev, marketing }))}
              />
            )}
            {section === "S" && (
              <MarketingCmsExtra
                mode="features"
                marketing={form.marketing}
                onChange={(marketing) => setForm((prev) => ({ ...prev, marketing }))}
              />
            )}
            {section === "T" && (
              <MarketingCmsExtra
                mode="teams"
                marketing={form.marketing}
                onChange={(marketing) => setForm((prev) => ({ ...prev, marketing }))}
              />
            )}

            <AdminStickySave loading={loading} message={message} />
          </form>
        )}

        {section === "V" && (
          <form className="space-y-6" onSubmit={saveSettings}>
            <AdminSectionBanner
              letter="V"
              title={SECTION_META.V.title}
              controls={SECTION_META.V.controls}
              preview={SECTION_META.V.preview}
            />
            <Section title="Signature generator">
              <Toggle
                label="Show Signature generator in app sidebar"
                checked={form.signatureGeneratorEnabled}
                onChange={(v) => set("signatureGeneratorEnabled", v)}
              />
              <Field
                label="Sidebar label"
                value={form.navSignatureGenerator}
                onChange={(v) => set("navSignatureGenerator", v)}
              />
              <Field
                label="Free plan downloads / month"
                value={String(form.generatorFreeDownloads)}
                onChange={(v) => set("generatorFreeDownloads", Math.max(0, Number(v) || 0))}
              />
              <p className="text-sm text-muted">
                Paid plan download limits follow Plans &amp; quotas (same as signature send limits).
              </p>
            </Section>
            <AdminStickySave loading={loading} message={message} />
          </form>
        )}

        {section === "W" && (
          <form className="space-y-6" onSubmit={saveSettings}>
            <AdminSectionBanner
              letter="W"
              title={SECTION_META.W.title}
              controls={SECTION_META.W.controls}
              preview={SECTION_META.W.preview}
            />
            <Section title="/pricing page — hero & layout">
              <p className="text-sm text-muted">
                Everything on <strong>/pricing</strong> is editable here: hero, highlight cards, API block, compare
                section, and each plan below.
              </p>
              <Field
                label="Hero kicker"
                value={form.marketing.pricing.kicker}
                onChange={(v) => setHero("pricing", "kicker", v)}
              />
              <Field
                label="Hero title"
                value={form.marketing.pricing.title}
                onChange={(v) => setHero("pricing", "title", v)}
              />
              <Area
                label="Hero lead"
                value={form.marketing.pricing.lead}
                onChange={(v) => setHero("pricing", "lead", v)}
              />
              <Field
                label="Hero primary CTA"
                value={form.marketing.pricing.cta}
                onChange={(v) => setHero("pricing", "cta", v)}
              />
              <Field
                label="Hero secondary CTA"
                value={form.marketing.pricing.secondary}
                onChange={(v) => setHero("pricing", "secondary", v)}
              />
              <Field
                label="Essentials eyebrow"
                value={form.marketing.pricingPage.essentialsEyebrow}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, essentialsEyebrow: v },
                    },
                  }))
                }
              />
              <Field
                label="Standard eyebrow"
                value={form.marketing.pricingPage.standardEyebrow}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, standardEyebrow: v },
                    },
                  }))
                }
              />
              <Field
                label="Standard card CTA"
                value={form.marketing.pricingPage.standardCta}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, standardCta: v },
                    },
                  }))
                }
              />
              <Field
                label='"Starts at" label'
                value={form.marketing.pricingPage.startsAtLabel}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, startsAtLabel: v },
                    },
                  }))
                }
              />
              <Field
                label="Month suffix"
                value={form.marketing.pricingPage.monthSuffix}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, monthSuffix: v },
                    },
                  }))
                }
              />
              <Toggle
                label="Show Essentials / Standard highlight row"
                checked={form.marketing.pricingPage.showHighlightRow}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, showHighlightRow: v },
                    },
                  }))
                }
              />
              <Toggle
                label="Show API plans block"
                checked={form.marketing.pricingPage.showApiBlock}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, showApiBlock: v },
                    },
                  }))
                }
              />
              <Field
                label="API kicker"
                value={form.marketing.pricingPage.apiKicker}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, apiKicker: v },
                    },
                  }))
                }
              />
              <Field
                label="API title"
                value={form.marketing.home.planApiTitle}
                onChange={(v) => setHomeField("planApiTitle", v)}
              />
              <Field
                label="API price ($ / month)"
                value={form.marketing.home.planApiPrice}
                onChange={(v) => setHomeField("planApiPrice", v)}
              />
              <Area
                label="API body"
                value={form.marketing.home.planApiBody}
                onChange={(v) => setHomeField("planApiBody", v)}
              />
              <Field
                label="API link label"
                value={form.marketing.pricingPage.apiLinkLabel}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, apiLinkLabel: v },
                    },
                  }))
                }
              />
              <Field
                label="API link URL"
                value={form.marketing.pricingPage.apiLinkHref}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, apiLinkHref: v },
                    },
                  }))
                }
              />
              <Toggle
                label="Show Compare plans grid"
                checked={form.marketing.pricingPage.showCompare}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, showCompare: v },
                    },
                  }))
                }
              />
              <Field
                label="Compare section title"
                value={form.marketing.pricingPage.compareTitle}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, compareTitle: v },
                    },
                  }))
                }
              />
              <Field
                label="Compare card CTA"
                value={form.marketing.pricingPage.compareCta}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    marketing: {
                      ...prev.marketing,
                      pricingPage: { ...prev.marketing.pricingPage, compareCta: v },
                    },
                  }))
                }
              />
            </Section>

            <Section title="Plans (compare grid + billing)">
              <p className="text-sm text-muted">
                Change <strong>Signature sends / downloads / faxes / seats</strong> — Billing &amp; Pricing
                feature lists update automatically from those numbers. Extra lines (Audit trail, SSO…) stay.
                Use <strong>-1</strong> for unlimited. Scroll down and press <strong>Save pricing page</strong>.
              </p>
              {form.plans.map((plan, idx) => {
                const patchPlan = (next: PlanDefinition, syncQuota = false) => {
                  const plans = [...form.plans];
                  plans[idx] = syncQuota ? withSyncedPlanFeatures(next) : next;
                  set("plans", plans);
                };
                return (
                <div
                  key={plan.id}
                  className="space-y-3 rounded-xl border border-[var(--line)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold capitalize">{plan.id} plan</h3>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={plan.visible}
                        onChange={(e) => patchPlan({ ...plan, visible: e.target.checked })}
                      />
                      Show on website / billing
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Display name"
                      value={plan.name}
                      onChange={(v) => patchPlan({ ...plan, name: v })}
                    />
                    <Field
                      label="Seats"
                      value={String(plan.seats)}
                      onChange={(v) => patchPlan({ ...plan, seats: Number(v) || 0 }, true)}
                    />
                    <Field
                      label="Monthly price ($)"
                      value={String(plan.monthly)}
                      onChange={(v) => patchPlan({ ...plan, monthly: Number(v) || 0 })}
                    />
                    <Field
                      label="Yearly price ($)"
                      value={String(plan.yearly)}
                      onChange={(v) => patchPlan({ ...plan, yearly: Number(v) || 0 })}
                    />
                    <Field
                      label="Signature sends / month"
                      value={String(plan.docs)}
                      onChange={(v) => patchPlan({ ...plan, docs: Number(v) }, true)}
                    />
                    <Field
                      label="Generator downloads / month"
                      value={String(plan.downloads)}
                      onChange={(v) => patchPlan({ ...plan, downloads: Number(v) }, true)}
                    />
                    <Field
                      label="Faxes / month"
                      value={String(plan.faxes)}
                      onChange={(v) => patchPlan({ ...plan, faxes: Number(v) }, true)}
                    />
                  </div>
                  <Area
                    label="Features on website (auto quota lines + your extras)"
                    value={plan.features.join("\n")}
                    onChange={(v) =>
                      patchPlan({
                        ...plan,
                        features: v
                          .split("\n")
                          .map((l) => l.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  {plan.id !== "free" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Stripe price ID · monthly"
                        value={plan.stripePriceMonthly}
                        onChange={(v) => patchPlan({ ...plan, stripePriceMonthly: v.trim() })}
                      />
                      <Field
                        label="Stripe price ID · yearly"
                        value={plan.stripePriceYearly}
                        onChange={(v) => patchPlan({ ...plan, stripePriceYearly: v.trim() })}
                      />
                    </div>
                  )}
                </div>
                );
              })}
            </Section>
            <AdminStickySave loading={loading} message={message} label="Save pricing page" />
          </form>
        )}

        {section === "X" && (
          <form className="space-y-6" onSubmit={saveSettings}>
            <AdminSectionBanner
              letter="X"
              title={SECTION_META.X.title}
              controls={SECTION_META.X.controls}
              preview={SECTION_META.X.preview}
            />
            <Section title="Auth & signup">
              <Toggle
                label="Allow public signup"
                checked={form.signupEnabled}
                onChange={(v) => set("signupEnabled", v)}
              />
              <Toggle
                label="Show Continue with Google"
                checked={form.showGoogleLogin}
                onChange={(v) => set("showGoogleLogin", v)}
              />
              <Toggle
                label="Allow member invites"
                checked={form.allowMemberInvites}
                onChange={(v) => set("allowMemberInvites", v)}
              />
              <p className="text-sm text-muted">
                Google login still needs GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env.local.
              </p>
            </Section>
            <AdminStickySave loading={loading} message={message} />
          </form>
        )}

        {section === "Y" && (
          <form className="space-y-6" onSubmit={saveSettings}>
            <AdminSectionBanner
              letter="Y"
              title={SECTION_META.Y.title}
              controls={SECTION_META.Y.controls}
              preview={SECTION_META.Y.preview}
            />
            <Section title="Send rules">
              <Field
                label="Max signers per request"
                value={String(form.maxSigners)}
                onChange={(v) => set("maxSigners", Number(v) || 1)}
              />
              <Field
                label="Default document title"
                value={form.defaultDocTitle}
                onChange={(v) => set("defaultDocTitle", v)}
              />
              <Field
                label="Free plan send limit (0 = must buy plan)"
                value={String(form.sendFreeLimit)}
                onChange={(v) => set("sendFreeLimit", Number(v) || 0)}
              />
              <Toggle
                label="Documents module enabled"
                checked={form.documentsEnabled}
                onChange={(v) => set("documentsEnabled", v)}
              />
              <Toggle
                label="Bulk send button"
                checked={form.bulkSendEnabled}
                onChange={(v) => set("bulkSendEnabled", v)}
              />
            </Section>
            <AdminStickySave loading={loading} message={message} />
          </form>
        )}

        {section === "U" && (
          <div className="space-y-5">
          <AdminSectionBanner
            letter="U"
            title={SECTION_META.U.title}
            controls={SECTION_META.U.controls}
            preview={SECTION_META.U.preview}
          />
          <Section title="Users control">
            <div className="overflow-x-auto md:col-span-2">
              <table className="w-full text-left text-sm">
                <thead className="text-[var(--muted)]">
                  <tr>
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Plan</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {localUsers.map((u) => (
                    <tr key={u.id} className="border-t border-[var(--line)]">
                      <td className="py-3 font-semibold">{u.name}</td>
                      <td className="py-3">{u.email}</td>
                      <td className="py-3">
                        <select
                          className="field !py-1.5"
                          value={u.role}
                          onChange={(e) => patchUser(u.id, { role: e.target.value as Role })}
                        >
                          <option value="owner">owner</option>
                          <option value="admin">admin</option>
                          <option value="member">member</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <select
                          className="field !py-1.5"
                          value={u.plan}
                          onChange={(e) => patchUser(u.id, { plan: e.target.value as PlanId })}
                        >
                          <option value="free">free</option>
                          <option value="starter">starter</option>
                          <option value="pro">pro</option>
                          <option value="business">business</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <button type="button" className="text-sm font-semibold text-[var(--bad)]" onClick={() => removeUser(u.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          </div>
        )}

        {section === "Z" && (
          <div className="space-y-5">
          <AdminSectionBanner
            letter="Z"
            title={SECTION_META.Z.title}
            controls={SECTION_META.Z.controls}
            preview={SECTION_META.Z.preview}
          />
          <Section title="Documents control">
            <div className="overflow-x-auto md:col-span-2">
              <table className="w-full text-left text-sm">
                <thead className="text-[var(--muted)]">
                  <tr>
                    <th className="py-2">Title</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Updated</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {localDocs.map((d) => (
                    <tr key={d.id} className="border-t border-[var(--line)]">
                      <td className="py-3 font-semibold">{d.title}</td>
                      <td className="py-3">
                        <select
                          className="field !py-1.5"
                          value={d.status}
                          onChange={(e) => patchDoc(d.id, { status: e.target.value })}
                        >
                          {["draft", "sent", "viewed", "completed", "void"].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <span className={`ml-2 ${statusTone(d.status)}`}>{d.status}</span>
                      </td>
                      <td className="py-3 text-[var(--muted)]">{formatDate(d.updatedAt)}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          className="text-sm font-semibold text-[var(--bad)]"
                          onClick={() => patchDoc(d.id, { delete: true })}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel space-y-4 p-5">
      <h2 className="text-lg font-semibold text-[#0b3d38]">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "color-text";
}) {
  return (
    <div className={type === "color-text" ? "md:col-span-1" : ""}>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        {type === "color-text" && (
          <input
            type="color"
            className="h-11 w-12 cursor-pointer rounded-lg border border-[var(--line)] bg-white p-1"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        <input className="field" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="md:col-span-2">
      <label className="label">{label}</label>
      <textarea className="field min-h-[90px]" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
