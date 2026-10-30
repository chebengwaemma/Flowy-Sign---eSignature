import { getPlan } from "./plans";
import { defaultSettings, mergeSettings } from "./settings";
import type { OrgSettings, PlanId } from "./types";

/** Resolve monthly signature-send limit from admin-controlled settings */
export function signatureSendLimit(planId: PlanId, settings?: OrgSettings | null) {
  const s = mergeSettings(settings || defaultSettings);
  if (planId === "free") return s.sendFreeLimit;
  if (planId === "starter") return s.starterSignatureLimit;
  if (planId === "pro") return s.proSignatureLimit;
  if (planId === "business") return s.businessSignatureLimit;
  return getPlan(planId).docs;
}

/** Resolve generator PNG download limit (free uses generatorFreeDownloads) */
export function signatureDownloadLimit(planId: PlanId, settings?: OrgSettings | null) {
  const s = mergeSettings(settings || defaultSettings);
  if (planId === "free") return Math.max(0, s.generatorFreeDownloads);
  return signatureSendLimit(planId, s);
}

export function faxLimit(planId: PlanId, settings?: OrgSettings | null) {
  const s = mergeSettings(settings || defaultSettings);
  if (planId === "free") return 0;
  if (planId === "starter") return s.starterFaxLimit;
  if (planId === "pro") return s.proFaxLimit;
  if (planId === "business") return s.businessFaxLimit;
  return getPlan(planId).faxes;
}
