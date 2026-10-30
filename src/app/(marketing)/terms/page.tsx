import { MarketingCta, MarketingHero } from "@/components/marketing/MarketingPage";
import { fillPlaceholders } from "@/lib/marketing";
import { getMarketing, getSiteSettings } from "@/lib/get-marketing";

export default async function TermsPage() {
  const settings = await getSiteSettings();
  const { terms, termsBody } = await getMarketing();
  const paragraphs = fillPlaceholders(termsBody, {
    brand: settings.companyLegalName,
    address: settings.companyAddress,
    email: settings.supportEmail,
  })
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="lp-page lp-sub">
      <MarketingHero
        kicker={terms.kicker}
        title={terms.title}
        lead={terms.lead}
        ctaHref="/privacy"
        ctaLabel={terms.cta}
        secondaryHref="/contact"
        secondaryLabel={terms.secondary}
      />
      <section className="lp-sub-body">
        <div className="lp-wrap" style={{ maxWidth: 760 }} data-animate="up">
          <div className="lp-sub-card" style={{ display: "grid", gap: 16 }}>
            {paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </div>
      </section>
      <MarketingCta />
    </main>
  );
}
