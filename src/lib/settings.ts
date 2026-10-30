import { defaultMarketing, mergeMarketing } from "./marketing";
import type { OrgSettings } from "./types";

export const defaultSettings: OrgSettings = {
  brandName: "Flowy Sign - eSignature",
  logoText: "Flowy Sign - eSignature",
  companyLegalName: "Flowy Sign - eSignature",
  companyAddress: "Austell GA, USA",
  aboutText:
    "Flowy Sign - eSignature helps teams send, sign, and manage documents with a calm, modern workspace. Based in Austell, GA, USA.",
  primaryColor: "#062925",
  accentColor: "#1FA97A",
  signalColor: "#FF6B35",
  supportEmail: "help@flowysign.com",
  landingHeadline: "Signatures that move as fast as your deals.",
  landingSubhead:
    "Send, sign, and fax documents in one calm workspace built for modern teams.",
  landingCta: "Create workspace",
  homeGreetingSuffix: "Your documents summary for the last 30 days",
  signButtonLabel: "Sign documents",
  bulkButtonLabel: "Bulk send",
  chatbotEnabled: true,
  chatbotName: "Flowy Assist",
  chatbotGreeting: "Hi — I'm Flowy Assist. Ask me about signing, fax, team, or billing.",
  faxEnabled: true,
  templatesEnabled: true,
  integrationsEnabled: true,
  apiEnabled: true,
  teamEnabled: true,
  billingEnabled: true,
  documentsEnabled: true,
  bulkSendEnabled: true,
  showUpgradeButton: true,
  allowMemberInvites: true,
  maintenanceMode: false,
  maintenanceMessage: "We’re upgrading Flowy Sign. Please check back shortly.",
  bulkModalTitle: "Upgrade your plan to use bulk send",
  bulkModalBody:
    "Bulk send is the easiest way to send a large number of signature requests at one time. Just open a template and import a CSV of signer emails and data.",
  defaultDocTitle: "Service Agreement",
  maxSigners: 10,
  navHome: "Home",
  navTemplates: "Templates",
  navDocuments: "Documents",
  navTeams: "Teams",
  navIntegrations: "Integrations",
  navApi: "API",
  navFax: "Send fax",
  navPricing: "Pricing",
  navProducts: "Products",
  navAdmin: "Admin",
  signatureGeneratorEnabled: true,
  navSignatureGenerator: "Signature generator",
  generatorFreeDownloads: 1,
  sendFreeLimit: 0,
  starterSignatureLimit: 50,
  proSignatureLimit: 250,
  businessSignatureLimit: -1,
  starterFaxLimit: 20,
  proFaxLimit: 100,
  businessFaxLimit: -1,
  signupEnabled: true,
  showGoogleLogin: true,
  marketing: defaultMarketing,
};

export function mergeSettings(partial?: Partial<OrgSettings> | null): OrgSettings {
  const p = partial || {};
  return {
    ...defaultSettings,
    ...p,
    marketing: mergeMarketing(p.marketing ?? defaultSettings.marketing),
  };
}
