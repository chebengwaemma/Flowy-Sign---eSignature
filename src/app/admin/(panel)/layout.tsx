import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  return (
    <div className="hidden-admin-shell">
      <header className="hidden-admin-top">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1fa97a]">Secret admin</p>
          <h1 className="text-lg font-semibold text-[#0b3d38]">Website control center</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted)]">
            {admin.name || "Admin"} · {admin.email || ""}
          </span>
          <Link href="/" className="source-btn" target="_blank">
            View site
          </Link>
          <form action="/api/admin/auth/logout" method="post">
            <button type="submit" className="source-btn primary">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="hidden-admin-body">{children}</div>
    </div>
  );
}
