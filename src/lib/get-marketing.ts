import { mergeSettings } from "./settings";
import { readStore } from "./store";
import type { MarketingSite } from "./marketing";
import type { OrgSettings } from "./types";

export async function getSiteSettings(): Promise<OrgSettings> {
  const store = await readStore();
  return mergeSettings(store.site);
}

export async function getMarketing(): Promise<MarketingSite> {
  const settings = await getSiteSettings();
  return settings.marketing;
}
