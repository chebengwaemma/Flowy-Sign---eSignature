import type { MarketingSite } from "./marketing";

export type Role = "owner" | "admin" | "member";
/** free + Pro/Business × (1 device | 5 devices). Legacy "starter" normalized away. */
export type PlanId = "free" | "pro" | "pro_5" | "business" | "business_5";
export type PlanCategory = "free" | "pro" | "business";
export type BillingInterval = "monthly" | "yearly";
/** Access package rules derived from plan device tiers */
export type PackageType = "none" | "unlimited_muscle" | "personal";
export type SubscriptionStatus = "inactive" | "active" | "past_due" | "canceled";
export type DocStatus = "draft" | "sent" | "viewed" | "completed" | "void";
export type FaxStatus = "queued" | "sending" | "delivered" | "failed" | "received";
export type FieldType = "signature" | "initials" | "date" | "text";

/** Admin-editable plan catalog entry (pricing site + billing + quotas) */
export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** Marketing category grouping on /pricing */
  category: PlanCategory;
  /** Concurrent signed-in devices (1 or 5 for paid plans) */
  maxDevices: number;
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
  /** Stripe subscription that renews this plan. */
  stripeSubscriptionId?: string;
  googleId?: string;
  authProvider?: "password" | "google";
  createdAt: string;
  /** Monthly PNG downloads from Signature generator (YYYY-MM) */
  generatorDownloadMonth?: string;
  generatorDownloadCount?: number;
  /** Access package (Unlimited Muscle / Personal) — synced from plan on payment */
  packageType?: PackageType;
  subscriptionStatus?: SubscriptionStatus;
  activeDevicesCount?: number;
  /** null = unlimited concurrent sessions (Unlimited Muscle) */
  maxConcurrentSessions?: number | null;
  packageActivatedAt?: string;
  packageExpiresAt?: string | null;
  resetTokenHash?: string;
  resetTokenExpires?: string;
  /** sha256 of the 6-digit reset code emailed with the link */
  resetOtpHash?: string;
  resetOtpExpires?: string;
  resetOtpAttempts?: number;
  /** Admin-issued password must be replaced on the next sign-in */
  mustChangePassword?: boolean;
  /** Stripe Checkout session already emailed, so confirm + webhook do not double-send */
  lastBillingEmailSessionId?: string;
  /**
   * Emails this account may send to or request a signature from.
   * A full list — one address per device — is permanent.
   */
  deviceSigners?: { name: string; email: string }[];
}

/** Concurrent login / device tracking */
export interface DeviceSession {
  id: string;
  userId: string;
  /** JWT jti */
  sessionId: string;
  deviceLabel: string;
  createdAt: string;
  lastSeenAt: string;
  revokedAt?: string;
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
  /** Resend API key for document-ready emails (falls back to RESEND_API_KEY env) */
  resendApiKey?: string;
  /** From header, e.g. Flowy Sign <hello@flowysign.com> */
  emailFrom?: string;
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
  /** Bump when catalog shape changes so legacy Mongo rows re-migrate once */
  planCatalogVersion?: number;
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
  /** Signer explicitly skipped this field (dates optional; signatures still need ≥1 filled) */
  skipped?: boolean;
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
  /** Large original stored outside the platform document */
  fileId?: string;
  fileName?: string;
  fields: SignatureField[];
  recipients: Recipient[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  /** Opaque token for email download links (payment-gated) */
  downloadToken?: string;
  readyEmailSentAt?: string;
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

/** In-app copy of outbound emails / alerts (always stored; email provider optional) */
export interface UserNotification {
  id: string;
  userId: string;
  type: "document_ready" | "system";
  title: string;
  body: string;
  href?: string;
  documentId?: string;
  createdAt: string;
  readAt?: string;
}

/** Password-reset mail waiting on Resend. The body is deleted after accept or final failure. */
export interface ResetMailJob {
  id: string;
  kind: "password-reset";
  userId: string;
  /** Registered address copied from that user row. Never a different mailbox. */
  to: string;
  otpHash: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
  attempts: number;
  nextAttemptAt: string;
  lockedUntil?: string;
  lastError?: string;
}

export interface PlatformStore {
  users: User[];
  organizations: Organization[];
  documents: Document[];
  faxes: FaxMessage[];
  invites: TeamInvite[];
  deviceSessions: DeviceSession[];
  notifications: UserNotification[];
  site: OrgSettings;
  /** Bumps only when an admin save should show up on open website tabs. */
  siteRevision: number;
  mailQueue?: ResetMailJob[];
}
