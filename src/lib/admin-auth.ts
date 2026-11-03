import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { connectDB } from "./db";
import { Admin } from "./models/Admin";

const COOKIE = "flowy_admin_session";
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "flowy-sign-data")
  : path.join(process.cwd(), "data");
const ADMIN_FILE = path.join(DATA_DIR, "admins.json");

type FileAdmin = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "superadmin" | "admin";
  createdAt: string;
};

type AdminPublic = {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
};

/** In-memory fallback when Vercel FS / Mongo seed file is unavailable */
let memoryAdmins: FileAdmin[] | null = null;

function secret() {
  const value =
    process.env.ADMIN_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "flowy-admin-dev-secret-change-me";
  return new TextEncoder().encode(value);
}

function seedCredentials() {
  return {
    email: (process.env.ADMIN_SEED_EMAIL || "superadmin@flowysign.com").toLowerCase(),
    password: process.env.ADMIN_SEED_PASSWORD || "Admin@12345",
    name: "Super Admin",
  };
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

async function readFileAdmins(): Promise<FileAdmin[]> {
  if (memoryAdmins?.length) return memoryAdmins;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const list = JSON.parse(await fs.readFile(ADMIN_FILE, "utf8")) as FileAdmin[];
    if (Array.isArray(list) && list.length) {
      memoryAdmins = list;
      return list;
    }
  } catch {
    /* miss */
  }
  return memoryAdmins || [];
}

async function writeFileAdmins(admins: FileAdmin[]) {
  memoryAdmins = admins;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(ADMIN_FILE, JSON.stringify(admins, null, 2), "utf8");
  } catch (err) {
    console.warn("[admin-auth] file write skipped:", (err as Error).message);
  }
}

async function mongoAvailable() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn("[admin-auth] Mongo unavailable:", (err as Error).message);
    return false;
  }
}

/**
 * Ensure a seed admin exists. Never overwrites an existing password on boot
 * (that previously locked people out when ADMIN_SEED_* differed from the live hash).
 * Password reset happens only when someone logs in with the seed credentials.
 */
export async function ensureSeedAdmin() {
  const seed = seedCredentials();
  const passwordHash = await bcrypt.hash(seed.password, 10);

  try {
    if (await mongoAvailable()) {
      const existing = await Admin.findOne({ email: seed.email });
      if (!existing) {
        await Admin.create({
          name: seed.name,
          email: seed.email,
          passwordHash,
          role: "superadmin",
        });
      }
    }
  } catch (err) {
    console.warn("[admin-auth] Mongo seed skipped:", (err as Error).message);
  }

  try {
    const fileAdmins = await readFileAdmins();
    if (!fileAdmins.some((a) => a.email === seed.email)) {
      await writeFileAdmins([
        {
          id: "admin_seed",
          name: seed.name,
          email: seed.email,
          passwordHash,
          role: "superadmin",
          createdAt: new Date().toISOString(),
        },
        ...fileAdmins,
      ]);
    }
  } catch (err) {
    console.warn("[admin-auth] File seed skipped:", (err as Error).message);
    if (!memoryAdmins?.length) {
      memoryAdmins = [
        {
          id: "admin_seed",
          name: seed.name,
          email: seed.email,
          passwordHash,
          role: "superadmin",
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }
}

/** Documented defaults — always accepted so login works even if Vercel ADMIN_SEED_* is wrong. */
const FALLBACK_SEED = {
  email: "superadmin@flowysign.com",
  password: "Admin@12345",
  name: "Super Admin",
} as const;

function loginSeedCandidates() {
  const envSeed = seedCredentials();
  const list = [envSeed, FALLBACK_SEED];
  // de-dupe by email+password
  const seen = new Set<string>();
  return list.filter((s) => {
    const key = `${s.email}::${s.password}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function signAdminToken(admin: AdminPublic) {
  return new SignJWT({
    sub: admin.id,
    typ: "admin",
    email: admin.email,
    name: admin.name,
    role: admin.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

/** Sets session cookie via next/headers (Server Actions / RSC). */
export async function createAdminSession(admin: AdminPublic) {
  const token = await signAdminToken(admin);
  const jar = await cookies();
  jar.set(COOKIE, token, cookieOptions(60 * 60 * 24 * 7));
  return token;
}

/** Prefer this in Route Handlers so Set-Cookie is attached to the JSON response. */
export async function attachAdminSession(res: NextResponse, admin: AdminPublic) {
  const token = await signAdminToken(admin);
  res.cookies.set(COOKIE, token, cookieOptions(60 * 60 * 24 * 7));
  return res;
}

export async function destroyAdminSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", cookieOptions(0));
}

export function clearAdminSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", cookieOptions(0));
  return res;
}

export async function getAdminSession(): Promise<AdminPublic | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || payload.typ !== "admin") return null;

    const jwtEmail = typeof payload.email === "string" ? payload.email : null;
    const jwtName = typeof payload.name === "string" ? payload.name : null;
    const jwtRole =
      payload.role === "superadmin" || payload.role === "admin" ? payload.role : null;

    // Prefer live Mongo profile when available
    if (await mongoAvailable()) {
      try {
        const admin = await Admin.findById(payload.sub).lean();
        if (admin) {
          return {
            id: String(admin._id),
            name: admin.name,
            email: admin.email,
            role: admin.role,
          };
        }
        if (jwtEmail) {
          const byEmail = await Admin.findOne({ email: jwtEmail.toLowerCase() }).lean();
          if (byEmail) {
            return {
              id: String(byEmail._id),
              name: byEmail.name,
              email: byEmail.email,
              role: byEmail.role,
            };
          }
        }
      } catch {
        /* fall through */
      }
    }

    const fileAdmins = await readFileAdmins();
    const admin =
      fileAdmins.find((a) => a.id === payload.sub) ||
      (jwtEmail ? fileAdmins.find((a) => a.email === jwtEmail.toLowerCase()) : undefined);
    if (admin) {
      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      };
    }

    // JWT still valid — keep session even if store lookup misses (serverless FS cold start)
    if (jwtEmail && jwtName && jwtRole) {
      return {
        id: String(payload.sub),
        name: jwtName,
        email: jwtEmail,
        role: jwtRole,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) throw new Error("ADMIN_UNAUTHORIZED");
  return admin;
}

export async function loginAdmin(email: string, password: string): Promise<AdminPublic | null> {
  try {
    await ensureSeedAdmin();
  } catch (err) {
    console.warn("[admin-auth] ensureSeedAdmin:", (err as Error).message);
  }

  const normalized = email.toLowerCase().trim();
  const matchingSeed = loginSeedCandidates().find(
    (s) => s.email === normalized && s.password === password,
  );

  try {
    if (await mongoAvailable()) {
      let admin = await Admin.findOne({ email: normalized });

      // Explicit seed login upserts/resets that account password (env or documented fallback)
      if (matchingSeed) {
        const passwordHash = await bcrypt.hash(matchingSeed.password, 10);
        if (!admin) {
          admin = await Admin.create({
            name: matchingSeed.name,
            email: matchingSeed.email,
            passwordHash,
            role: "superadmin",
          });
        } else {
          const ok = await bcrypt.compare(password, admin.passwordHash);
          if (!ok) {
            admin.passwordHash = passwordHash;
            admin.role = "superadmin";
            await admin.save();
          }
        }
      }

      if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
        return {
          id: String(admin._id),
          name: admin.name,
          email: admin.email,
          role: admin.role,
        };
      }
    }
  } catch (err) {
    console.warn("[admin-auth] Mongo login path:", (err as Error).message);
  }

  const fileAdmins = await readFileAdmins();
  let admin = fileAdmins.find((a) => a.email === normalized);

  if (matchingSeed) {
    const passwordHash = await bcrypt.hash(matchingSeed.password, 10);
    if (!admin) {
      admin = {
        id: "admin_seed",
        name: matchingSeed.name,
        email: matchingSeed.email,
        passwordHash,
        role: "superadmin",
        createdAt: new Date().toISOString(),
      };
      await writeFileAdmins([admin, ...fileAdmins]);
    } else if (!(await bcrypt.compare(password, admin.passwordHash))) {
      admin = { ...admin, passwordHash, role: "superadmin", name: matchingSeed.name };
      const next = fileAdmins.map((a) => (a.email === normalized ? admin! : a));
      await writeFileAdmins(next);
    }
  }

  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return null;
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

export async function signupAdmin(input: { name: string; email: string; password: string }) {
  try {
    await ensureSeedAdmin();
  } catch {
    /* continue */
  }
  const email = input.email.toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);

  if (await mongoAvailable()) {
    const existing = await Admin.findOne({ email });
    if (existing) throw new Error("EXISTS");
    const admin = await Admin.create({
      name: input.name,
      email,
      passwordHash,
      role: "admin",
    });
    const pub: AdminPublic = {
      id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };
    await createAdminSession(pub);
    return pub;
  }

  const fileAdmins = await readFileAdmins();
  if (fileAdmins.some((a) => a.email === email)) throw new Error("EXISTS");
  const admin: FileAdmin = {
    id: `admin_${Date.now()}`,
    name: input.name,
    email,
    passwordHash,
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  fileAdmins.push(admin);
  await writeFileAdmins(fileAdmins);
  const pub: AdminPublic = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
  await createAdminSession(pub);
  return pub;
}
