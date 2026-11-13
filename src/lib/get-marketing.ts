import { cache } from "react";
import { unstable_cache } from "next/cache";
import { isMongoSkipped } from "./db";
import { defaultMarketing, mergeMarketing } from "./marketing";
import { mergeSettings } from "./settings";
import { readStore } from "./store";
import type { MarketingSite } from "./marketing";
import type { OrgSettings } from "./types";

export type PublicSite = {
  settings: OrgSettings;
  revision: number;
};

async function loadPublicSiteLive(): Promise<PublicSite> {
  if (isMongoSkipped()) return { settings: mergeSettings(null), revision: 0 };
  try {
    const store = await readStore();
    return {
      settings: mergeSettings(store?.site),
      revision: store?.siteRevision || 0,
    };
  } catch {
    return { settings: mergeSettings(null), revision: 0 };
  }
}

/** One cached read for the public shell. Admin save drops this tag. */
const getCachedPublicSite = unstable_cache(
  async () => loadPublicSiteLive(),
  ["flowy-public-site-v1"],
  { revalidate: 60, tags: ["flowy-store"] },
);

const emptyPublicSite = (): PublicSite => ({ settings: mergeSettings(null), revision: 0 });

/** Settings plus the live revision, shared by the header and the page in one request. */
export const getPublicSite = cache(async (): Promise<PublicSite> => {
  try {
    return await getCachedPublicSite();
  } catch {
    return emptyPublicSite();
  }
});

/** Public marketing/settings — cached; falls back instantly if Mongo is down. */
export const getSiteSettings = cache(async (): Promise<OrgSettings> => {
  return (await getPublicSite()).settings;
});

export const getMarketing = cache(async (): Promise<MarketingSite> => {
  try {
    const settings = await getSiteSettings();
    return mergeMarketing(settings?.marketing);
  } catch {
    return defaultMarketing;
  }
});
