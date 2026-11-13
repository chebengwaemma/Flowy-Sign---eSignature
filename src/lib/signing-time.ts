/**
 * Lists follow the viewer's device. A date written onto a signed document
 * is always US Eastern (EST/EDT), not the signer's local zone.
 */

/** US Eastern, including daylight saving. */
export const SIGNING_TIME_ZONE = "America/New_York";

const dateOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const stampOptions: Intl.DateTimeFormatOptions = {
  ...dateOptions,
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

export function isIanaTimeZone(value: string | undefined | null): value is string {
  const zone = value?.trim() || "";
  if (!zone || zone.length > 64) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: zone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** Browser zone when this runs on the device. Undefined if the runtime has none. */
export function deviceTimeZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isIanaTimeZone(zone) ? zone : undefined;
  } catch {
    return undefined;
  }
}

export function formatInTimeZone(
  date: Date,
  timeZone?: string | null,
  withTime = false,
  locale = "en-US",
) {
  const options: Intl.DateTimeFormatOptions = withTime ? { ...stampOptions } : { ...dateOptions };
  if (isIanaTimeZone(timeZone)) options.timeZone = timeZone;
  return withTime ? date.toLocaleString(locale, options) : date.toLocaleDateString(locale, options);
}

/** Date and clock time frozen onto the document, always in US Eastern. */
export function signerStamp(_timeZone?: string | null, date = new Date(), locale = "en-US") {
  return formatInTimeZone(date, SIGNING_TIME_ZONE, true, locale);
}

export function formatLocalStamp(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return formatInTimeZone(date, deviceTimeZone(), true);
}
