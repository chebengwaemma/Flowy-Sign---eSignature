/**
 * Display times follow the viewer's device. A date written onto a document
 * uses the signer's IANA zone, sent by their browser at the moment they sign.
 */

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

/** Date and clock time in the signer's own country, frozen onto the document. */
export function signerStamp(timeZone?: string | null, date = new Date(), locale = "en-US") {
  return formatInTimeZone(date, timeZone, true, locale);
}

export function formatLocalStamp(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return formatInTimeZone(date, deviceTimeZone(), true);
}
