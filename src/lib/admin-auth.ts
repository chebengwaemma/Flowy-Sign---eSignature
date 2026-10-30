import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectDB } from "./db";
import { Admin } from "./models/Admin";

const COOKIE = "flowy_admin_session";
const DATA_DIR = path.join(process.cwd(), "data");
const ADMIN_FILE = path.join(DATA_DIR, "admins.json");

type FileAdmin = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "superadmin" | "admin";
  createdAt: string;
};

function secret() {
  const value =
    process.env.ADMIN_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "flowy-admin-dev-secret-change-me";
  return new TextEncoder().encode(value);
}

async function readFileAdmins(): Promise<FileAdmin[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    return JSON.parse(await fs.readFile(ADMIN_FILE, "utf8")) as FileAdmin[];
  } catch {
    return [];
  }
}

async function writeFileAdmins(admins: FileAdmin[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ADMIN_FILE, JSON.stringify(admins, null, 2), "utf8");
}

async function mongoAvailable() {
  try {
    await connectDB();
    return true;
  } catch {
    return false;
  }
}

export async function ensureSeedAdmin() {
  const email = (process.env.ADMIN_SEED_EMAIL || "superadmin@flowysign.com").toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";
  const passwordHash = await bcrypt.hash(password, 10);

  if (await mongoAvailable()) {
    const count = await Admin.countDocuments();
    if (count === 0) {
      await Admin.create({
        name: "Super Admin",
        email,
        passwordHash,
        role: "superadmin",
      });
    }
  }

  const fileAdmins = await readFileAdmins();
  if (fileAdmins.length === 0) {
    await writeFileAdmins([
      {
        id: "admin_seed",
        name: "Super Admin",
        email,
        passwordHash,
        role: "superadmin",
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

export async function createAdminSession(adminId: string) {
  const token = await new SignJWT({ sub: adminId, typ: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroyAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || payload.typ !== "admin") return null;

    if (await mongoAvailable()) {
      const admin = await Admin.findById(payload.sub).lean();
      if (admin) {
        return {
          id: String(admin._id),
          name: admin.name,
          email: admin.email,
          role: admin.role,
        };
      }
    }

    const fileAdmins = await readFileAdmins();
    const admin = fileAdmins.find((a) => a.id === payload.sub);
    if (!admin) return null;
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) throw new Error("ADMIN_UNAUTHORIZED");
  return admin;
}

export async function loginAdmin(email: string, password: string) {
  await ensureSeedAdmin();
  const normalized = email.toLowerCase();

  if (await mongoAvailable()) {
    const admin = await Admin.findOne({ email: normalized });
    if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
      await createAdminSession(String(admin._id));
      return {
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      };
    }
  }

  const fileAdmins = await readFileAdmins();
  const admin = fileAdmins.find((a) => a.email === normalized);
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return null;
  await createAdminSession(admin.id);
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

export async function signupAdmin(input: { name: string; email: string; password: string }) {
  await ensureSeedAdmin();
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
    await createAdminSession(String(admin._id));
    return {
      id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };
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
  await createAdminSession(admin.id);
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}
