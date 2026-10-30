import { getPlanFromSettings } from "./plans";
import { defaultSettings, mergeSettings } from "./settings";
import type { OrgSettings, PlanId } from "./types";

/** Resolve monthly signature-send limit from admin-controlled plans */
export function signatureSendLimit(planId: PlanId, settings?: OrgSettings | null) {
  const s = mergeSettings(settings || defaultSettings);
  return getPlanFromSettings(planId, s).docs;
}

/** Resolve generator PNG download limit */
export function signatureDownloadLimit(planId: PlanId, settings?: OrgSettings | null) {
  const s = mergeSettings(settings || defaultSettings);
  return getPlanFromSettings(planId, s).downloads;
}

export function faxLimit(planId: PlanId, settings?: OrgSettings | null) {
  const s = mergeSettings(settings || defaultSettings);
  return getPlanFromSettings(planId, s).faxes;
}
