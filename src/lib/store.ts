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

const DATA_DIR = path.join(process.cwd(), "data");
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

function normalizeStore(store: PlatformStore): PlatformStore {
  store.site = mergeSettings(store.site);
  store.organizations = (store.organizations || []).map((org) => ({
    ...org,
    settings: mergeSettings(org.settings),
  }));
  store.users = store.users || [];
  store.documents = store.documents || [];
  store.faxes = store.faxes || [];
  store.invites = store.invites || [];
  return store;
}

async function readFileStore(): Promise<PlatformStore> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return normalizeStore(JSON.parse(raw) as PlatformStore);
  } catch {
    const initial = seed();
    await fs.writeFile(STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

async function writeFileStore(store: PlatformStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function readMongoStore(): Promise<PlatformStore | null> {
  try {
    await connectDB();
    let doc = await Platform.findOne({ key: "main" });
    if (!doc) {
      const initial = seed();
      // Prefer existing file seed if present
      try {
        const file = await readFileStore();
        doc = await Platform.create({ key: "main", data: file });
      } catch {
        doc = await Platform.create({ key: "main", data: initial });
      }
    }
    return normalizeStore(doc.data as PlatformStore);
  } catch (err) {
    console.warn("[store] MongoDB unavailable, using file store:", (err as Error).message);
    return null;
  }
}

async function writeMongoStore(store: PlatformStore): Promise<boolean> {
  try {
    await connectDB();
    await Platform.findOneAndUpdate(
      { key: "main" },
      { data: store },
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
  // Always mirror to file as backup
  await writeFileStore(store);
  if (!ok) {
    // file already written
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
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
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
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getOrgFaxes(orgId: string) {
  const store = await readStore();
  return store.faxes
    .filter((f) => f.orgId === orgId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
