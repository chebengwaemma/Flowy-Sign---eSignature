import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { mergeSettings } from "@/lib/settings";
import { readStore, updateStore } from "@/lib/store";

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
  generatorFreeDownloads: z.number().int().min(0).optional(),
  sendFreeLimit: z.number().int().min(0).optional(),
  starterSignatureLimit: z.number().int().optional(),
  proSignatureLimit: z.number().int().optional(),
  businessSignatureLimit: z.number().int().optional(),
  starterFaxLimit: z.number().int().optional(),
  proFaxLimit: z.number().int().optional(),
  businessFaxLimit: z.number().int().optional(),
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

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  let settings = null;
  await updateStore((store) => {
    store.site = mergeSettings({ ...store.site, ...body.data });
    // Push site settings to every org so main site updates everywhere
    store.organizations = store.organizations.map((org) => ({
      ...org,
      settings: mergeSettings({ ...org.settings, ...body.data }),
    }));
    settings = store.site;
  });

  return NextResponse.json({ settings });
}
