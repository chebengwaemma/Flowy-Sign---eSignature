import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { publishLiveSite } from "@/lib/live-site";
import { PLAN_CATALOG_VERSION } from "@/lib/plans";
import { mergeSettings } from "@/lib/settings";
import { bumpSiteRevision, readStore, updateStore } from "@/lib/store";

const schema = z.object({
  brandName: z.string().min(1).optional(),
  logoText: z.string().min(1).optional(),
  companyLegalName: z.string().optional(),
  companyAddress: z.string().optional(),
  aboutText: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  signalColor: z.string().optional(),
  supportEmail: z.string().email().optional(),
  resendApiKey: z.string().optional(),
  emailFrom: z.string().optional(),
  landingHeadline: z.string().optional(),
  landingSubhead: z.string().optional(),
  landingCta: z.string().optional(),
  homeGreetingSuffix: z.string().optional(),
  signButtonLabel: z.string().optional(),
  bulkButtonLabel: z.string().optional(),
  chatbotEnabled: z.boolean().optional(),
  chatbotName: z.string().optional(),
  chatbotGreeting: z.string().optional(),
  faxEnabled: z.boolean().optional(),
  templatesEnabled: z.boolean().optional(),
  integrationsEnabled: z.boolean().optional(),
  apiEnabled: z.boolean().optional(),
  teamEnabled: z.boolean().optional(),
  billingEnabled: z.boolean().optional(),
  documentsEnabled: z.boolean().optional(),
  bulkSendEnabled: z.boolean().optional(),
  showUpgradeButton: z.boolean().optional(),
  allowMemberInvites: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  bulkModalTitle: z.string().optional(),
  bulkModalBody: z.string().optional(),
  defaultDocTitle: z.string().optional(),
  maxSigners: z.number().int().min(1).max(50).optional(),
  navHome: z.string().optional(),
  navTemplates: z.string().optional(),
  navDocuments: z.string().optional(),
  navTeams: z.string().optional(),
  navIntegrations: z.string().optional(),
  navApi: z.string().optional(),
  navFax: z.string().optional(),
  navPricing: z.string().optional(),
  navProducts: z.string().optional(),
  navAdmin: z.string().optional(),
  signatureGeneratorEnabled: z.boolean().optional(),
  navSignatureGenerator: z.string().optional(),
  generatorFreeDownloads: z.number().int().optional(),
  sendFreeLimit: z.number().int().optional(),
  starterSignatureLimit: z.number().int().optional(),
  proSignatureLimit: z.number().int().optional(),
  businessSignatureLimit: z.number().int().optional(),
  starterFaxLimit: z.number().int().optional(),
  proFaxLimit: z.number().int().optional(),
  businessFaxLimit: z.number().int().optional(),
  plans: z
    .array(
      z.object({
        id: z.enum(["free", "pro", "pro_5", "business", "business_5"]),
        name: z.string().min(1),
        category: z.enum(["free", "pro", "business"]),
        maxDevices: z.number().int().min(1).max(50),
        monthly: z.number(),
        yearly: z.number(),
        docs: z.number().int(),
        downloads: z.number().int(),
        faxes: z.number().int(),
        seats: z.number().int(),
        features: z.array(z.string()),
        visible: z.boolean(),
        stripePriceMonthly: z.string(),
        stripePriceYearly: z.string(),
      }),
    )
    .optional(),
  signupEnabled: z.boolean().optional(),
  showGoogleLogin: z.boolean().optional(),
}).passthrough();

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = await readStore();
  return NextResponse.json({
    settings: mergeSettings(store.site),
    organizations: store.organizations.map((o) => ({
      id: o.id,
      name: o.name,
      plan: o.plan,
    })),
  });
}

export async function PATCH(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null);
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (record.supportEmail === "") delete record.supportEmail;
    if (Array.isArray(record.plans)) {
      record.plans = record.plans.map((plan) => {
        const row = plan && typeof plan === "object" ? (plan as Record<string, unknown>) : {};
        const money = (value: unknown) => {
          const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
          return Number.isFinite(n) ? n : 0;
        };
        return {
          ...row,
          monthly: money(row.monthly),
          yearly: money(row.yearly),
          maxDevices: Math.min(50, Math.max(1, Math.round(Number(row.maxDevices) || 1))),
          docs: Math.round(Number(row.docs) || 0),
          downloads: Math.round(Number(row.downloads) || 0),
          faxes: Math.round(Number(row.faxes) || 0),
          seats: Math.round(Number(row.seats) || 0),
          stripePriceMonthly: String(row.stripePriceMonthly ?? ""),
          stripePriceYearly: String(row.stripePriceYearly ?? ""),
          features: Array.isArray(row.features) ? row.features.map((item) => String(item)) : [],
          visible: Boolean(row.visible),
        };
      });
    }
  }
  const body = schema.safeParse(raw);
  if (!body.success) {
    const issue = body.error.issues[0];
    const where = issue?.path?.length ? issue.path.join(".") : "settings";
    return NextResponse.json(
      { error: issue ? `${where}: ${issue.message}` : "Invalid settings" },
      { status: 400 },
    );
  }

  let settings = null;
  await updateStore((store) => {
    store.site = mergeSettings({
      ...store.site,
      ...body.data,
      planCatalogVersion: PLAN_CATALOG_VERSION,
    });
    if (body.data.plans?.length) {
      const byId = new Map(body.data.plans.map((plan) => [plan.id, plan]));
      store.site.plans = store.site.plans.map((plan) => {
        const over = byId.get(plan.id);
        if (!over) return plan;
        return {
          ...plan,
          name: over.name,
          monthly: over.monthly,
          yearly: over.yearly,
          maxDevices: over.maxDevices,
          docs: over.docs,
          downloads: over.downloads,
          faxes: over.faxes,
          seats: over.seats,
          features: over.features,
          visible: over.visible,
          stripePriceMonthly: over.stripePriceMonthly,
          stripePriceYearly: over.stripePriceYearly,
        };
      });
      store.site.planCatalogVersion = PLAN_CATALOG_VERSION;
    }
    // Push site settings to every org so main site updates everywhere
    store.organizations = store.organizations.map((org) => ({
      ...org,
      settings: mergeSettings({ ...org.settings, ...body.data }),
    }));
    settings = store.site;
    bumpSiteRevision(store);
  });

  // When admin changes plan $ amounts, create/find matching Stripe Prices so Checkout ≠ stale $15
  if (body.data.plans?.length && settings) {
    try {
      const { syncPlanStripePriceIds } = await import("@/lib/stripe");
      const synced = await syncPlanStripePriceIds(settings);
      if (synced !== settings) {
        await updateStore((store) => {
          store.site = mergeSettings({ ...store.site, plans: synced.plans });
          settings = store.site;
          bumpSiteRevision(store);
        });
      }
    } catch (err) {
      console.warn(
        "[admin/settings] Stripe price sync skipped:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  publishLiveSite();

  return NextResponse.json({ settings, result: "success" });
}
