import type { Document, SignatureField, SignatureMark } from "./types";

export function todayLabel(locale = "en-US") {
  return new Date().toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function recipientFields(doc: Document, recipientId: string) {
  return (doc.fields || []).filter((f) => f.recipientId === recipientId);
}

export function isSignatureLike(field: SignatureField) {
  return field.type === "signature" || field.type === "initials";
}

export function isFilled(field: SignatureField) {
  if (field.skipped) return false;
  if (field.type === "date" || field.type === "text") return Boolean(field.value?.trim());
  return Boolean(field.value?.trim() || field.signature);
}

/** At least one signature/initials must be filled; non-skipped sig fields must all be filled. */
export function canCompleteSigning(doc: Document, recipientId: string) {
  const mine = recipientFields(doc, recipientId);
  const sigs = mine.filter(isSignatureLike);
  if (sigs.length === 0) return false;
  const filled = sigs.filter(isFilled);
  if (filled.length === 0) return false;
  const required = sigs.filter((f) => !f.skipped);
  return required.every(isFilled);
}

export function clearField(field: SignatureField) {
  field.value = undefined;
  field.signature = undefined;
  field.signedAt = undefined;
  field.skipped = false;
}

export function applySignatureToField(
  field: SignatureField,
  mark: SignatureMark,
  display: string,
  initials?: string,
) {
  field.skipped = false;
  field.signedAt = new Date().toISOString();
  if (field.type === "initials") {
    const text = (initials || display.slice(0, 2)).toUpperCase();
    field.value = text;
    field.signature = { mode: "typed", text, style: mark.style || "script" };
    return;
  }
  field.value = display;
  field.signature = { ...mark };
}

export function applyDateToField(field: SignatureField, value?: string) {
  field.skipped = false;
  field.signedAt = new Date().toISOString();
  field.value = (value || todayLabel()).trim();
  field.signature = undefined;
}

export function skipField(field: SignatureField) {
  field.skipped = true;
  field.value = undefined;
  field.signature = undefined;
  field.signedAt = new Date().toISOString();
}
