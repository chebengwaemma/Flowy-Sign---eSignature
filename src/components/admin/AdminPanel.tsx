"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { MarketingCmsExtra } from "@/components/admin/MarketingCmsExtra";
import type { MarketingSite, PageHero } from "@/lib/marketing";
import { mergeSettings } from "@/lib/settings";
import type { DocStatus, OrgSettings, PlanId, Role } from "@/lib/types";
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

const MENU_GROUPS = [
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
      { id: "H", title: "App home copy" },
      { id: "I", title: "Interface labels" },
      { id: "J", title: "Bulk send modal" },
      { id: "K", title: "App nav labels" },
    ],
  },
  {
    id: "people",
    title: "Users & documents",
    items: [
      { id: "U", title: "Users control" },
      { id: "V", title: "Signature generator" },
      { id: "W", title: "Plans & quotas" },
      { id: "X", title: "Auth & signup" },
      { id: "Y", title: "Send rules" },
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
  const [form, setForm] = useState(() => mergeSettings(settings));
  const [section, setSection] = useState<SectionId>("A");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
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
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage("Could not save settings");
      return;
    }
    setMessage("All admin settings saved. Frontend will reflect changes immediately.");
    router.refresh();
  }

  async function patchUser(userId: string, patch: Partial<AdminUser>) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...patch }),
    });
    const data = await res.json();
    if (res.ok) {
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
    const data = await res.json();
    if (!res.ok) return;
    if (patch.delete) {
      setLocalDocs((prev) => prev.filter((d) => d.id !== documentId));
    } else {
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

        {section !== "U" && section !== "Z" && (
          <form onSubmit={saveSettings} className="space-y-5">
            {section === "A" && (
              <Section title="Appearance & brand">
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
              <Section title="Home & landing copy">
                <Field label="Landing headline" value={form.landingHeadline} onChange={(v) => set("landingHeadline", v)} />
                <Area label="Landing subhead" value={form.landingSubhead} onChange={(v) => set("landingSubhead", v)} />
                <Field label="Landing CTA" value={form.landingCta} onChange={(v) => set("landingCta", v)} />
                <Field
                  label="Home greeting suffix"
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
              <Section title="App navigation labels">
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
              <Section title="Marketing homepage copy">
                <Field label="Hero title" value={form.marketing.home.heroTitle} onChange={(v) => setHomeField("heroTitle", v)} />
                <Area label="Hero lead" value={form.marketing.home.heroLead} onChange={(v) => setHomeField("heroLead", v)} />
                <Field label="Hero CTA" value={form.marketing.home.heroCta} onChange={(v) => setHomeField("heroCta", v)} />
                <Field label="Hero secondary" value={form.marketing.home.heroSecondary} onChange={(v) => setHomeField("heroSecondary", v)} />
                <Field label="Stars label" value={form.marketing.home.starsLabel} onChange={(v) => setHomeField("starsLabel", v)} />
                <Field label="Integrations kicker" value={form.marketing.home.integKicker} onChange={(v) => setHomeField("integKicker", v)} />
                <Field label="Integrations title" value={form.marketing.home.integTitle} onChange={(v) => setHomeField("integTitle", v)} />
                <Area label="Integrations sub" value={form.marketing.home.integSub} onChange={(v) => setHomeField("integSub", v)} />
                <Field label="Integrations link" value={form.marketing.home.integLink} onChange={(v) => setHomeField("integLink", v)} />
                <Field label="Features title" value={form.marketing.home.featuresTitle} onChange={(v) => setHomeField("featuresTitle", v)} />
                <Field label="Teams title" value={form.marketing.home.teamsTitle} onChange={(v) => setHomeField("teamsTitle", v)} />
                <Area label="Teams sub" value={form.marketing.home.teamsSub} onChange={(v) => setHomeField("teamsSub", v)} />
                <Field label="Steps title" value={form.marketing.home.stepsTitle} onChange={(v) => setHomeField("stepsTitle", v)} />
                <Area label="Steps sub" value={form.marketing.home.stepsSub} onChange={(v) => setHomeField("stepsSub", v)} />
                <Field label="Tools title" value={form.marketing.home.toolsTitle} onChange={(v) => setHomeField("toolsTitle", v)} />
                <Area label="Tools body" value={form.marketing.home.toolsBody} onChange={(v) => setHomeField("toolsBody", v)} />
                <Field label="Plans title" value={form.marketing.home.plansTitle} onChange={(v) => setHomeField("plansTitle", v)} />
                <Field label="Stories title" value={form.marketing.home.storiesTitle} onChange={(v) => setHomeField("storiesTitle", v)} />
                <Field label="Bottom CTA title" value={form.marketing.home.bottomTitle} onChange={(v) => setHomeField("bottomTitle", v)} />
                <Field label="Pillar 1 title" value={form.marketing.home.pillar1Title} onChange={(v) => setHomeField("pillar1Title", v)} />
                <Area label="Pillar 1 body" value={form.marketing.home.pillar1Body} onChange={(v) => setHomeField("pillar1Body", v)} />
                <Field label="Pillar 2 title" value={form.marketing.home.pillar2Title} onChange={(v) => setHomeField("pillar2Title", v)} />
                <Area label="Pillar 2 body" value={form.marketing.home.pillar2Body} onChange={(v) => setHomeField("pillar2Body", v)} />
                <Field label="Pillar 3 title" value={form.marketing.home.pillar3Title} onChange={(v) => setHomeField("pillar3Title", v)} />
                <Area label="Pillar 3 body" value={form.marketing.home.pillar3Body} onChange={(v) => setHomeField("pillar3Body", v)} />
                <Field label="Pillar 4 title" value={form.marketing.home.pillar4Title} onChange={(v) => setHomeField("pillar4Title", v)} />
                <Area label="Pillar 4 body" value={form.marketing.home.pillar4Body} onChange={(v) => setHomeField("pillar4Body", v)} />
                <Field label="Plan team title" value={form.marketing.home.planTeamTitle} onChange={(v) => setHomeField("planTeamTitle", v)} />
                <Field label="Plan team price" value={form.marketing.home.planTeamPrice} onChange={(v) => setHomeField("planTeamPrice", v)} />
                <Area label="Plan team body" value={form.marketing.home.planTeamBody} onChange={(v) => setHomeField("planTeamBody", v)} />
                <Field label="Plan API title" value={form.marketing.home.planApiTitle} onChange={(v) => setHomeField("planApiTitle", v)} />
                <Field label="Plan API price" value={form.marketing.home.planApiPrice} onChange={(v) => setHomeField("planApiPrice", v)} />
                <Area label="Plan API body" value={form.marketing.home.planApiBody} onChange={(v) => setHomeField("planApiBody", v)} />
                <Field label="Story 1 metric" value={form.marketing.home.story1Metric} onChange={(v) => setHomeField("story1Metric", v)} />
                <Area label="Story 1 quote" value={form.marketing.home.story1Quote} onChange={(v) => setHomeField("story1Quote", v)} />
                <Field label="Story 1 by" value={form.marketing.home.story1By} onChange={(v) => setHomeField("story1By", v)} />
                <Field label="Story 2 metric" value={form.marketing.home.story2Metric} onChange={(v) => setHomeField("story2Metric", v)} />
                <Area label="Story 2 quote" value={form.marketing.home.story2Quote} onChange={(v) => setHomeField("story2Quote", v)} />
                <Field label="Story 2 by" value={form.marketing.home.story2By} onChange={(v) => setHomeField("story2By", v)} />
                <Field label="Story 3 metric" value={form.marketing.home.story3Metric} onChange={(v) => setHomeField("story3Metric", v)} />
                <Area label="Story 3 quote" value={form.marketing.home.story3Quote} onChange={(v) => setHomeField("story3Quote", v)} />
                <Field label="Story 3 by" value={form.marketing.home.story3By} onChange={(v) => setHomeField("story3By", v)} />
              </Section>
            )}

            {section === "M" && (
              <Section title="Marketing page heroes">
                {(
                  [
                    ["why", "Why"],
                    ["features", "Features"],
                    ["teams", "Teams"],
                    ["developers", "Developers"],
                    ["pricing", "Pricing"],
                    ["help", "Help"],
                    ["about", "About"],
                    ["contact", "Contact"],
                    ["press", "Press"],
                    ["privacy", "Privacy"],
                    ["terms", "Terms"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-2">
                    <p className="md:col-span-2 text-sm font-bold text-[#0b3d38]">{label}</p>
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

            {message && <p className="text-sm font-semibold text-accent-deep">{message}</p>}
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save A–Z settings"}
            </button>
          </form>
        )}

        {section === "V" && (
          <form className="space-y-6" onSubmit={saveSettings}>
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
            {message && <p className="text-sm font-semibold text-accent-deep">{message}</p>}
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save A–Z settings"}
            </button>
          </form>
        )}

        {section === "W" && (
          <form className="space-y-6" onSubmit={saveSettings}>
            <Section title="Plans & quotas">
              <p className="text-sm text-muted">
                Controls monthly signature sends and generator downloads for each package. Use{" "}
                <strong>-1</strong> for unlimited.
              </p>
              <Field
                label="Free · signature sends / month"
                value={String(form.sendFreeLimit)}
                onChange={(v) => set("sendFreeLimit", Number(v) || 0)}
              />
              <Field
                label="Free · generator downloads / month"
                value={String(form.generatorFreeDownloads)}
                onChange={(v) => set("generatorFreeDownloads", Math.max(0, Number(v) || 0))}
              />
              <Field
                label="Starter · signatures / downloads"
                value={String(form.starterSignatureLimit)}
                onChange={(v) => set("starterSignatureLimit", Number(v) || 0)}
              />
              <Field
                label="Starter · faxes"
                value={String(form.starterFaxLimit)}
                onChange={(v) => set("starterFaxLimit", Number(v) || 0)}
              />
              <Field
                label="Pro · signatures / downloads"
                value={String(form.proSignatureLimit)}
                onChange={(v) => set("proSignatureLimit", Number(v) || 0)}
              />
              <Field
                label="Pro · faxes"
                value={String(form.proFaxLimit)}
                onChange={(v) => set("proFaxLimit", Number(v) || 0)}
              />
              <Field
                label="Business · signatures / downloads (-1 unlimited)"
                value={String(form.businessSignatureLimit)}
                onChange={(v) => set("businessSignatureLimit", Number(v))}
              />
              <Field
                label="Business · faxes (-1 unlimited)"
                value={String(form.businessFaxLimit)}
                onChange={(v) => set("businessFaxLimit", Number(v))}
              />
            </Section>
            {message && <p className="text-sm font-semibold text-accent-deep">{message}</p>}
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save A–Z settings"}
            </button>
          </form>
        )}

        {section === "X" && (
          <form className="space-y-6" onSubmit={saveSettings}>
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
            {message && <p className="text-sm font-semibold text-accent-deep">{message}</p>}
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save A–Z settings"}
            </button>
          </form>
        )}

        {section === "Y" && (
          <form className="space-y-6" onSubmit={saveSettings}>
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
            {message && <p className="text-sm font-semibold text-accent-deep">{message}</p>}
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save A–Z settings"}
            </button>
          </form>
        )}

        {section === "U" && (
          <Section title="Users control">
            <div className="overflow-x-auto">
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
        )}

        {section === "Z" && (
          <Section title="Documents control">
            <div className="overflow-x-auto">
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
