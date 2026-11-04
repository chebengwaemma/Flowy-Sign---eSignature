import { cache } from "react";
import { connection } from "next/server";
import { defaultMarketing, mergeMarketing } from "./marketing";
import { mergeSettings } from "./settings";
import { readStore } from "./store";
import type { MarketingSite } from "./marketing";
import type { OrgSettings } from "./types";

/** Always read live admin settings from Mongo (never a cached static snapshot). */
export const getSiteSettings = cache(async (): Promise<OrgSettings> => {
  await connection();
  try {
    const store = await readStore();
    return mergeSettings(store?.site);
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
