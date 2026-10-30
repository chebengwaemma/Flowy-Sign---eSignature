import { connection } from "next/server";
import { defaultMarketing, mergeMarketing } from "./marketing";
import { mergeSettings } from "./settings";
import { readStore } from "./store";
import type { MarketingSite } from "./marketing";
import type { OrgSettings } from "./types";

/** Always read live admin settings from Mongo (never a cached static snapshot). */
export async function getSiteSettings(): Promise<OrgSettings> {
  await connection();
  try {
    const store = await readStore();
    return mergeSettings(store?.site);
  } catch {
    return mergeSettings(null);
  }
}

export async function getMarketing(): Promise<MarketingSite> {
  try {
    const settings = await getSiteSettings();
    return mergeMarketing(settings?.marketing);
  } catch {
    return defaultMarketing;
  }
}
