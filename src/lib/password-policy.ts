export const PASSWORD_RULE =
  "Use at least 10 characters with an uppercase letter, a lowercase letter, a number, and a symbol.";

/** Rules for a password someone is choosing now. Existing saved passwords still sign in. */
export function passwordIssue(password: string): string | null {
  if (password.length < 10) return PASSWORD_RULE;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return PASSWORD_RULE;
  if (!/[0-9]/.test(password)) return PASSWORD_RULE;
  if (!/[^A-Za-z0-9]/.test(password)) return PASSWORD_RULE;
  return null;
}
