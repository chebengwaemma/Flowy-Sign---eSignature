import type { MarketingSite } from "./marketing";

export type Role = "owner" | "admin" | "member";
export type PlanId = "free" | "starter" | "pro" | "business";
export type BillingInterval = "monthly" | "yearly";
export type DocStatus = "draft" | "sent" | "viewed" | "completed" | "void";
export type FaxStatus = "queued" | "sending" | "delivered" | "failed" | "received";
export type FieldType = "signature" | "initials" | "date" | "text";

/** Admin-editable plan catalog entry (pricing site + billing + quotas) */
export interface PlanDefinition {
  id: PlanId;
  name: string;
  monthly: number;
  yearly: number;
  /** Signature sends / month (-1 unlimited) */
  docs: number;
  /** Generator downloads / month (-1 unlimited) */
  downloads: number;
  faxes: number;
  seats: number;
  features: string[];
  visible: boolean;
  stripePriceMonthly: string;
  stripePriceYearly: string;
}

/** Handwriting fonts for the live e-signature generator */
export type SignatureStyle =
  | "elegant"
  | "script"
  | "formal"
  | "casual"
  | "marker"
  | "classic"
  /** legacy aliases still accepted from older docs */
  | "bold"
  | "italic"
  | "slant"
  | "strike";

export type SignatureMode = "typed" | "image";
export type DocFileKind = "text" | "image" | "pdf";

/** Stored on a field when the recipient adopts a signature — never mutates document.content */
export interface SignatureMark {
  mode: SignatureMode;
  text?: string;
  style?: SignatureStyle;
  /** data:image/...;base64,... — custom uploaded signature */
  imageDataUrl?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
  orgId: string;
  plan: PlanId;
  billingInterval: BillingInterval | null;
  stripeCustomerId?: string;
  googleId?: string;
  authProvider?: "password" | "google";
  createdAt: string;
  /** Monthly PNG downloads from Signature generator (YYYY-MM) */
  generatorDownloadMonth?: string;
  generatorDownloadCount?: number;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  plan: PlanId;
  settings: OrgSettings;
  createdAt: string;
}

export interface OrgSettings {
  brandName: string;
  logoText: string;
  companyLegalName: string;
  companyAddress: string;
  aboutText: string;
  primaryColor: string;
  accentColor: string;
  signalColor: string;
  supportEmail: string;
  landingHeadline: string;
  landingSubhead: string;
  landingCta: string;
  homeGreetingSuffix: string;
  signButtonLabel: string;
  bulkButtonLabel: string;
  chatbotEnabled: boolean;
  chatbotName: string;
  chatbotGreeting: string;
  faxEnabled: boolean;
  templatesEnabled: boolean;
  integrationsEnabled: boolean;
  apiEnabled: boolean;
  teamEnabled: boolean;
  billingEnabled: boolean;
  documentsEnabled: boolean;
  bulkSendEnabled: boolean;
  showUpgradeButton: boolean;
  allowMemberInvites: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  bulkModalTitle: string;
  bulkModalBody: string;
  defaultDocTitle: string;
  maxSigners: number;
  navHome: string;
  navTemplates: string;
  navDocuments: string;
  navTeams: string;
  navIntegrations: string;
  navApi: string;
  navFax: string;
  navPricing: string;
  navProducts: string;
  navAdmin: string;
  /** Signature generator module in app sidebar */
  signatureGeneratorEnabled: boolean;
  navSignatureGenerator: string;
  /** Free plan: PNG downloads / month from generator */
  generatorFreeDownloads: number;
  /** Free plan: signature *sends* / month (0 = must buy a plan) */
  sendFreeLimit: number;
  starterSignatureLimit: number;
  proSignatureLimit: number;
  /** -1 = unlimited */
  businessSignatureLimit: number;
  starterFaxLimit: number;
  proFaxLimit: number;
  businessFaxLimit: number;
  /**
   * Full plan catalog (name, price, quotas, features, Stripe price IDs).
   * Admin edits → public pricing + billing + enforcement.
   */
  plans: PlanDefinition[];
  signupEnabled: boolean;
  showGoogleLogin: boolean;
  /** Full marketing website copy — editable in admin */
  marketing: MarketingSite;
}

export interface SignatureField {
  id: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  recipientId: string;
  value?: string;
  signature?: SignatureMark;
  signedAt?: string;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  status: "pending" | "viewed" | "signed";
  token: string;
  signedAt?: string;
  /** Suggested typed signature style from the send wizard */
  preferredSignatureStyle?: SignatureStyle;
}

export interface Document {
  id: string;
  orgId: string;
  ownerId: string;
  title: string;
  status: DocStatus;
  /** Original document body — never rewritten when signing */
  content: string;
  fileKind?: DocFileKind;
  /** Original upload as data URL (image/pdf) — kept intact; marks overlay only */
  fileDataUrl?: string;
  fileName?: string;
  fields: SignatureField[];
  recipients: Recipient[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface FaxMessage {
  id: string;
  orgId: string;
  userId: string;
  direction: "outbound" | "inbound";
  toNumber: string;
  fromNumber: string;
  subject: string;
  pages: number;
  status: FaxStatus;
  createdAt: string;
}

export interface TeamInvite {
  id: string;
  orgId: string;
  email: string;
  role: Role;
  invitedBy: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface PlatformStore {
  users: User[];
  organizations: Organization[];
  documents: Document[];
  faxes: FaxMessage[];
  invites: TeamInvite[];
  site: OrgSettings;
}
