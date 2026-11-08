import { revalidatePath } from "next/cache";

const LIVE_PATHS = [
  "/",
  "/pricing",
  "/billing",
  "/about",
  "/contact",
  "/why",
  "/features",
  "/teams",
  "/developers",
  "/help",
  "/press",
  "/privacy",
  "/terms",
  "/dashboard",
  "/documents",
  "/signature-generator",
  "/login",
  "/signup",
  "/forgot-password",
  "/admin",
];

/** Drop cached HTML so the next live refresh paints the admin save. */
export function publishLiveSite() {
  for (const path of LIVE_PATHS) revalidatePath(path);
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}
