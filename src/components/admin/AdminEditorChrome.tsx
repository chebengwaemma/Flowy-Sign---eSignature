"use client";

/** Banner + sticky save used on every detailed A–Z admin editor */

export function AdminSectionBanner({
  letter,
  title,
  controls,
  preview,
}: {
  letter: string;
  title: string;
  controls: string;
  preview?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[#f7fbf9] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#0b3d38]">
            <span className="admin-letter mr-1">{letter}</span>
            {title}
          </p>
          <p className="mt-1 text-sm text-muted">{controls}</p>
          <p className="mt-1 text-xs text-muted">
            Edit → scroll to <strong>Save</strong> → open Preview (hard refresh if needed).
          </p>
        </div>
        {preview ? (
          <a className="btn btn-primary shrink-0" href={preview} target="_blank" rel="noreferrer">
            Preview page
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function AdminStickySave({
  loading,
  message,
  label = "Save A–Z settings",
}: {
  loading: boolean;
  message: string;
  label?: string;
}) {
  return (
    <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-white/95 p-3 shadow-lg backdrop-blur">
      {message ? <p className="text-sm font-semibold text-accent-deep">{message}</p> : (
        <p className="text-xs text-muted">Changes apply to the live website after save.</p>
      )}
      <button className="btn btn-primary ml-auto" disabled={loading} type="submit">
        {loading ? "Saving…" : label}
      </button>
    </div>
  );
}

export const SECTION_META: Record<
  string,
  { title: string; controls: string; preview?: string }
> = {
  A: {
    title: "Appearance & brand",
    controls: "Brand name, logo, legal name, address, about text, theme colors (site + app).",
    preview: "/",
  },
  B: {
    title: "Billing visibility",
    controls: "Show billing nav and Upgrade button inside the logged-in app.",
    preview: "/billing",
  },
  C: {
    title: "Chatbot",
    controls: "Enable/disable chatbot, name, and greeting on marketing pages.",
    preview: "/",
  },
  D: {
    title: "Documents defaults",
    controls: "Default document title, max signers, documents module on/off.",
    preview: "/documents",
  },
  E: {
    title: "Email & support",
    controls: "Support email used in contact/help/legal placeholders.",
    preview: "/contact",
  },
  F: {
    title: "Features & modules",
    controls: "Toggle fax, templates, integrations, API, team, billing modules.",
    preview: "/dashboard",
  },
  G: {
    title: "Maintenance",
    controls: "Put the app in maintenance mode with a custom message.",
    preview: "/dashboard",
  },
  H: {
    title: "Website hero (quick)",
    controls: "Public homepage hero title, lead, CTAs (same fields as L).",
    preview: "/",
  },
  I: {
    title: "Interface labels",
    controls: "Sign documents / Bulk send button labels in the app.",
    preview: "/dashboard",
  },
  J: {
    title: "Bulk send modal",
    controls: "Bulk send upgrade modal title and body copy.",
    preview: "/dashboard",
  },
  K: {
    title: "App nav labels",
    controls: "Logged-in sidebar labels (not the public marketing header).",
    preview: "/dashboard",
  },
  L: {
    title: "Homepage copy",
    controls: "Every homepage block: hero, integrations, pillars, teams, steps, tools, plans, stories.",
    preview: "/",
  },
  M: {
    title: "Page heroes",
    controls: "Hero kicker/title/lead/CTAs for Why, Features, Teams, Developers, Help, About…",
    preview: "/why",
  },
  N: {
    title: "Nav & footer menu",
    controls: "Public header labels and footer links.",
    preview: "/",
  },
  O: {
    title: "Steps / teams / API blocks",
    controls: "Homepage step cards, team cards, and developers feature blocks.",
    preview: "/#teams",
  },
  P: {
    title: "FAQs",
    controls: "Help center FAQ questions and answers.",
    preview: "/help",
  },
  Q: {
    title: "Privacy & Terms",
    controls: "Full legal body text (supports {{brand}} {{address}} {{email}}).",
    preview: "/privacy",
  },
  R: {
    title: "About / Contact / Press",
    controls: "Card grids on About, Contact, and Press pages.",
    preview: "/about",
  },
  S: {
    title: "Feature pages",
    controls: "Each /features/[slug] detail page — title, lead, sections.",
    preview: "/features",
  },
  T: {
    title: "Team pages",
    controls: "Each /teams/[slug] detail page — title, lead, sections.",
    preview: "/teams",
  },
  V: {
    title: "Signature generator",
    controls: "Sidebar visibility, label, free-plan download quota.",
    preview: "/signature-generator",
  },
  W: {
    title: "Pricing page & plans",
    controls: "Full /pricing layout + plan name/price/quotas/features/Stripe IDs + /billing.",
    preview: "/pricing",
  },
  X: {
    title: "Auth & signup",
    controls: "Public signup on/off, Google login, member invites.",
    preview: "/signup",
  },
  Y: {
    title: "Send rules",
    controls: "Max signers, free send limit, documents/bulk toggles.",
    preview: "/documents/new",
  },
  U: {
    title: "Users control",
    controls: "Change any user role and plan instantly.",
    preview: "/admin",
  },
  Z: {
    title: "Documents control",
    controls: "Admin document list — status changes and deletes.",
    preview: "/documents",
  },
};
