import { getSiteSettings } from "./get-marketing";
import { getPlanFromSettings } from "./plans";
import { getEmailConfig, sendEmail } from "./email";
import { updateStore } from "./store";
import type { BillingInterval, PlanId } from "./types";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Email the buyer and the site admin once per checkout session. */
export async function maybeSendPurchaseEmail(input: {
  userId: string;
  sessionId: string;
  plan: PlanId;
  interval: BillingInterval;
}) {
  let email = "";
  let name = "";
  let shouldSend = false;
  await updateStore((store) => {
    const user = store.users.find((u) => u.id === input.userId);
    if (!user) return;
    if (user.lastBillingEmailSessionId === input.sessionId) return;
    user.lastBillingEmailSessionId = input.sessionId;
    shouldSend = true;
    email = user.email;
    name = user.name || user.email;
  });
  if (!shouldSend || !email) return;

  const site = await getSiteSettings();
  const { apiKey, from } = getEmailConfig(site);
  const plan = getPlanFromSettings(input.plan, site);
  const amount = input.interval === "yearly" ? plan.yearly : plan.monthly;
  const period = input.interval === "yearly" ? "yearly" : "monthly";
  const brand = site.brandName || "Flowy Sign - eSignature";
  const admin = (site.supportEmail || "help@flowysign.com").trim();

  const buyerText = [
    `Hi ${name},`,
    "",
    `Your ${plan.name} plan is active (${period}, $${amount}).`,
    "",
    `You can send documents from your dashboard.`,
    "",
    `— ${brand}`,
  ].join("\n");

  await sendEmail({
    to: email,
    subject: `Your ${brand} plan is active`,
    text: buyerText,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.55;color:#0b1220;max-width:560px">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Your <strong>${escapeHtml(plan.name)}</strong> plan is active (${escapeHtml(period)}, $${amount}).</p>
      <p>You can send documents from your dashboard.</p>
      <p>— ${escapeHtml(brand)}</p>
    </div>`,
    apiKey,
    from,
  });

  if (admin && admin.toLowerCase() !== email.toLowerCase()) {
    await sendEmail({
      to: admin,
      subject: `New package: ${name}`,
      text: `${name} <${email}> bought ${plan.name} (${period}, $${amount}).`,
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.55;color:#0b1220">
        <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) bought ${escapeHtml(plan.name)} (${escapeHtml(period)}, $${amount}).</p>
      </div>`,
      apiKey,
      from,
    });
  }
}
