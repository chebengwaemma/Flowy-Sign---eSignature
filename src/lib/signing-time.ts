/** Document dates and signing stamps use US Eastern time (EST/EDT). */
export const SIGNING_TIME_ZONE = "America/New_York";

const dateOptions: Intl.DateTimeFormatOptions = {
  timeZone: SIGNING_TIME_ZONE,
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

export function formatSigningDate(date = new Date(), locale = "en-US") {
  return date.toLocaleDateString(locale, dateOptions);
}

export function formatSigningStamp(date = new Date(), locale = "en-US") {
  return date.toLocaleString(locale, stampOptions);
}
