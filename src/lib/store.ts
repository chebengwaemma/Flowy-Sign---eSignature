import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type {
  Document,
  FaxMessage,
  Organization,
  PlatformStore,
  TeamInvite,
  User,
} from "./types";
import { defaultSettings, mergeSettings } from "./settings";
import { connectDB } from "./db";
import { Platform } from "./models/Platform";

/** On Vercel the app FS is read-only — use /tmp for file fallback. */
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "flowy-sign-data")
  : path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function seed(): PlatformStore {
  const orgId = "org_demo";
  const adminId = "user_admin";
  const memberId = "user_member";
  const now = new Date().toISOString();

  const org: Organization = {
    id: orgId,
    name: "Flowy Demo Co",
    ownerId: adminId,
    plan: "pro",
    settings: { ...defaultSettings },
    createdAt: now,
  };

  const users: User[] = [
    {
      id: adminId,
      email: "admin@flowysign.com",
      name: "Alex Rivera",
      password: "admin123",
      role: "owner",
      orgId,
      plan: "pro",
      billingInterval: "monthly",
      createdAt: now,
    },
    {
      id: memberId,
      email: "user@flowysign.com",
      name: "Sam Chen",
      password: "user123",
      role: "member",
      orgId,
      plan: "pro",
      billingInterval: "monthly",
      createdAt: now,
    },
  ];

  const documents: Document[] = [
    {
      id: "doc_welcome",
      orgId,
      ownerId: adminId,
      title: "Vendor Agreement — Acme",
      status: "sent",
      content:
        "VENDOR AGREEMENT\n\nThis agreement is entered into between Flowy Demo Co and Acme Partners.\n\n1. Scope of Services\nThe Vendor shall provide consulting services as described in Exhibit A.\n\n2. Payment Terms\nInvoices are due within 30 days of receipt.\n\n3. Term\nThis agreement begins on the Effective Date and continues for 12 months.\n\nIN WITNESS WHEREOF, the parties have executed this agreement.",
      fields: [
        {
          id: "fld_1",
          type: "signature",
          page: 1,
          x: 12,
          y: 72,
          width: 28,
          height: 8,
          recipientId: "rcp_1",
        },
        {
          id: "fld_2",
          type: "date",
          page: 1,
          x: 48,
          y: 72,
          width: 18,
          height: 5,
          recipientId: "rcp_1",
        },
      ],
      recipients: [
        {
          id: "rcp_1",
          name: "Jordan Lee",
          email: "jordan@acme.example",
          status: "pending",
          token: "sign_demo_token",
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const faxes: FaxMessage[] = [
    {
      id: "fax_1",
      orgId,
      userId: adminId,
      direction: "outbound",
      toNumber: "+1 (555) 010-2200",
      fromNumber: "+1 (555) 010-1000",
      subject: "Signed vendor packet",
      pages: 3,
      status: "delivered",
      createdAt: now,
    },
    {
      id: "fax_2",
      orgId,
      userId: adminId,
      direction: "inbound",
      toNumber: "+1 (555) 010-1000",
      fromNumber: "+1 (555) 010-8844",
      subject: "Insurance certificate",
      pages: 2,
      status: "received",
      createdAt: now,
    },
  ];

  return {
    users,
    organizations: [org],
    documents,
    faxes,
    invites: [],
    site: { ...defaultSettings },
  };
}

function normalizeStore(raw: unknown): PlatformStore {
  const base =
    raw && typeof raw === "object"
      ? (raw as Partial<PlatformStore>)
      : ({} as Partial<PlatformStore>);

  const store: PlatformStore = {
    users: (Array.isArray(base.users) ? base.users : []).map((u) => ({
      ...u,
      id: u?.id || "",
      email: u?.email || "",
      name: u?.name || u?.email || "User",
      role: u?.role || "member",
      orgId: u?.orgId || "",
      plan: u?.plan || "free",
      createdAt: u?.createdAt || new Date().toISOString(),
    })),
    organizations: Array.isArray(base.organizations) ? base.organizations : [],
    documents: (Array.isArray(base.documents) ? base.documents : []).map((d) => ({
      ...d,
      id: d?.id || "",
      orgId: d?.orgId || "",
      ownerId: d?.ownerId || "",
      title: d?.title || "Untitled",
      status: d?.status || "draft",
      content: d?.content || "",
      fields: Array.isArray(d?.fields) ? d.fields : [],
      recipients: Array.isArray(d?.recipients) ? d.recipients : [],
      createdAt: d?.createdAt || new Date().toISOString(),
      updatedAt: d?.updatedAt || d?.createdAt || new Date().toISOString(),
    })),
    faxes: (Array.isArray(base.faxes) ? base.faxes : []).map((f) => ({
      ...f,
      id: f?.id || "",
      orgId: f?.orgId || "",
      createdAt: f?.createdAt || new Date().toISOString(),
    })),
    invites: Array.isArray(base.invites) ? base.invites : [],
    site: mergeSettings(base.site),
  };

  // Keep org settings filled, but platform site CMS remains source of truth for branding/plans
  store.organizations = store.organizations.map((org) => ({
    ...org,
    id: org?.id || "",
    name: org?.name || "Workspace",
    ownerId: org?.ownerId || "",
    plan: org?.plan || "free",
    createdAt: org?.createdAt || new Date().toISOString(),
    settings: mergeSettings({
      ...(org?.settings || {}),
      // Live admin CMS always wins for plans + marketing + brand
      ...store.site,
      plans: store.site.plans,
      marketing: store.site.marketing,
      brandName: store.site.brandName,
      logoText: store.site.logoText,
      primaryColor: store.site.primaryColor,
      accentColor: store.site.accentColor,
      signalColor: store.site.signalColor,
    }),
  }));

  return store;
}

async function readFileStore(): Promise<PlatformStore> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return normalizeStore(JSON.parse(raw) as PlatformStore);
  } catch {
    const initial = seed();
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
    } catch {
      /* ephemeral / read-only FS — keep seed in memory for this request */
    }
    return normalizeStore(initial);
  }
}

async function writeFileStore(store: PlatformStore): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.warn("[store] file mirror skipped:", (err as Error).message);
  }
}

async function readMongoStore(): Promise<PlatformStore | null> {
  try {
    await connectDB();
    // lean() = plain object, always fresh from Mongo (no mongoose doc cache)
    let doc = await Platform.findOne({ key: "main" }).lean<{ data?: unknown }>().exec();
    if (!doc?.data) {
      const initial = seed();
      try {
        const file = await readFileStore();
        await Platform.create({ key: "main", data: file });
        return normalizeStore(file);
      } catch {
        await Platform.create({ key: "main", data: initial });
        return normalizeStore(initial);
      }
    }
    return normalizeStore(doc.data);
  } catch (err) {
    console.warn("[store] MongoDB unavailable, using file store:", (err as Error).message);
    return null;
  }
}

async function writeMongoStore(store: PlatformStore): Promise<boolean> {
  try {
    await connectDB();
    // $set + lean round-trip so Mixed nested CMS fields (plans, marketing) persist fully
    const plain = JSON.parse(JSON.stringify(store)) as PlatformStore;
    await Platform.findOneAndUpdate(
      { key: "main" },
      { $set: { data: plain } },
      { upsert: true, new: true },
    );
    return true;
  } catch (err) {
    console.warn("[store] MongoDB write failed:", (err as Error).message);
    return false;
  }
}

export async function readStore(): Promise<PlatformStore> {
  const mongo = await readMongoStore();
  if (mongo) return mongo;
  return readFileStore();
}

export async function writeStore(store: PlatformStore): Promise<void> {
  const ok = await writeMongoStore(store);
  await writeFileStore(store);
  if (!ok) {
    // File mirror may be ephemeral on Vercel; Mongo is source of truth in production
    if (process.env.VERCEL || process.env.MONGODB_URI) {
      throw new Error(
        "Database write failed. Check MONGODB_URI and Atlas Network Access (allow 0.0.0.0/0 for Vercel).",
      );
    }
  }
}

export async function updateStore(
  mutator: (store: PlatformStore) => void | PlatformStore,
): Promise<PlatformStore> {
  const store = await readStore();
  const result = mutator(store);
  const next = result ?? store;
  await writeStore(next);
  return next;
}

export async function findUserByEmail(email: string) {
  const store = await readStore();
  const needle = (email || "").toLowerCase();
  if (!needle) return undefined;
  return store.users.find((u) => (u.email || "").toLowerCase() === needle);
}

export async function findUserById(id: string) {
  const store = await readStore();
  return store.users.find((u) => u.id === id);
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<User> {
  const now = new Date().toISOString();
  const orgId = nanoid(10);
  const userId = nanoid(10);

  const user: User = {
    id: userId,
    email: input.email.toLowerCase(),
    name: input.name,
    password: input.password,
    role: "owner",
    orgId,
    plan: "free",
    billingInterval: null,
    authProvider: "password",
    createdAt: now,
  };

  const org: Organization = {
    id: orgId,
    name: `${input.name}'s Workspace`,
    ownerId: userId,
    plan: "free",
    settings: mergeSettings((await readStore()).site),
    createdAt: now,
  };

  await updateStore((store) => {
    store.users.push(user);
    store.organizations.push(org);
  });

  return user;
}

export async function findOrCreateGoogleUser(input: {
  googleId: string;
  email: string;
  name: string;
}): Promise<User> {
  const store = await readStore();
  const byGoogle = store.users.find((u) => u.googleId === input.googleId);
  if (byGoogle) return byGoogle;

  const byEmail = store.users.find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase(),
  );
  if (byEmail) {
    await updateStore((s) => {
      const u = s.users.find((x) => x.id === byEmail.id);
      if (!u) return;
      u.googleId = input.googleId;
      u.authProvider = u.authProvider || "google";
      if (!u.name) u.name = input.name;
    });
    return (await findUserById(byEmail.id))!;
  }

  const now = new Date().toISOString();
  const orgId = nanoid(10);
  const userId = nanoid(10);
  const user: User = {
    id: userId,
    email: input.email.toLowerCase(),
    name: input.name || input.email.split("@")[0],
    password: "",
    role: "owner",
    orgId,
    plan: "free",
    billingInterval: null,
    googleId: input.googleId,
    authProvider: "google",
    createdAt: now,
  };
  const org: Organization = {
    id: orgId,
    name: `${user.name}'s Workspace`,
    ownerId: userId,
    plan: "free",
    settings: mergeSettings(store.site),
    createdAt: now,
  };

  await updateStore((s) => {
    s.users.push(user);
    s.organizations.push(org);
  });

  return user;
}

export async function getOrgDocuments(orgId: string) {
  const store = await readStore();
  return store.documents
    .filter((d) => d.orgId === orgId)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export async function getOrgFaxes(orgId: string) {
  const store = await readStore();
  return store.faxes
    .filter((f) => f.orgId === orgId)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function getOrgMembers(orgId: string) {
  const store = await readStore();
  return store.users.filter((u) => u.orgId === orgId);
}

export async function getOrgInvites(orgId: string) {
  const store = await readStore();
  return store.invites.filter((i) => i.orgId === orgId && i.status === "pending");
}

export type { Document, FaxMessage, TeamInvite, User };
