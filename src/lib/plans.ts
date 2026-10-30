import type { PlanId } from "./types";

export const PLANS = [
  {
    id: "free" as PlanId,
    name: "Free",
    monthly: 0,
    yearly: 0,
    docs: 0,
    faxes: 0,
    seats: 1,
    features: [
      "1 signature generator download / month",
      "Buy a plan to send signature requests",
      "Browse templates",
      "Email support",
    ],
  },
  {
    id: "starter" as PlanId,
    name: "Starter",
    monthly: 15,
    yearly: 144,
    docs: 50,
    faxes: 20,
    seats: 3,
    features: [
      "50 signature requests / month",
      "50 signature downloads / month",
      "20 faxes",
      "3 team seats",
      "Audit trail",
    ],
  },
  {
    id: "pro" as PlanId,
    name: "Pro",
    monthly: 39,
    yearly: 372,
    docs: 250,
    faxes: 100,
    seats: 10,
    features: [
      "250 signature requests / month",
      "250 signature downloads / month",
      "100 faxes",
      "10 seats",
      "Priority support",
      "Custom branding",
    ],
  },
  {
    id: "business" as PlanId,
    name: "Business",
    monthly: 79,
    yearly: 756,
    docs: -1,
    faxes: -1,
    seats: 50,
    features: [
      "Unlimited signature requests",
      "Unlimited signature downloads",
      "Unlimited faxes",
      "50 seats",
      "Admin controls",
      "SSO-ready",
    ],
  },
] as const;

export function getPlan(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
