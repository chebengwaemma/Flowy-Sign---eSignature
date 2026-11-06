import { cache } from "react";
import { unstable_cache } from "next/cache";
import { isMongoSkipped } from "./db";
import { defaultMarketing, mergeMarketing } from "./marketing";
import { mergeSettings } from "./settings";
import { readStore } from "./store";
import type { MarketingSite } from "./marketing";
import type { OrgSettings } from "./types";

async function loadSiteSettingsLive(): Promise<OrgSettings> {
  if (isMongoSkipped()) return mergeSettings(null);
  try {
    const store = await readStore();
    return mergeSettings(store?.site);
  } catch {
    return mergeSettings(null);
  }
}

/** Short data cache — keeps public pages fast; admin edits show within ~1 min. */
const getCachedSiteSettings = unstable_cache(
  async () => loadSiteSettingsLive(),
  ["flowy-site-settings-v2"],
  { revalidate: 60, tags: ["flowy-store"] },
);

/** Public marketing/settings — cached; falls back instantly if Mongo is down. */
export const getSiteSettings = cache(async (): Promise<OrgSettings> => {
  try {
    return await getCachedSiteSettings();
  } catch {
    return mergeSettings(null);
  }
});

export const getMarketing = cache(async (): Promise<MarketingSite> => {
  try {
    const settings = await getSiteSettings();
    return mergeMarketing(settings?.marketing);
  } catch {
    return defaultMarketing;
  }
});
