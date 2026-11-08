import { getPlanFromSettings } from "./plans";
import { defaultSettings, mergeSettings } from "./settings";
import type { OrgSettings, PlanId } from "./types";

/** Monthly signature-send limit from the admin plan row. -1 is unlimited. */
export function signatureSendLimit(planId: PlanId, settings?: OrgSettings | null) {
  const s = mergeSettings(settings || defaultSettings);
  return getPlanFromSettings(planId, s).docs;
}

/** Generator PNG download limit from the admin plan row. -1 is unlimited. */
export function signatureDownloadLimit(planId: PlanId, settings?: OrgSettings | null) {
  const s = mergeSettings(settings || defaultSettings);
  return getPlanFromSettings(planId, s).downloads;
}

export function faxLimit(planId: PlanId, settings?: OrgSettings | null) {
  const s = mergeSettings(settings || defaultSettings);
  return getPlanFromSettings(planId, s).faxes;
}
