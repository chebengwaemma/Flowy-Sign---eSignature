"use client";

import type { DetailPage } from "@/components/marketing/page-content";
import type { FaqItem, MarketingSite, StepItem, TeamCard, TextCard } from "@/lib/marketing";

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="field" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="md:col-span-2">
      <label className="label">{label}</label>
      <textarea className="field min-h-[90px]" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel space-y-4 p-5">
      <h2 className="text-lg font-semibold text-[#0b3d38]">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function MarketingCmsExtra({
  marketing,
  onChange,
  mode,
}: {
  marketing: MarketingSite;
  onChange: (next: MarketingSite) => void;
  mode: "lists" | "faqs" | "legal" | "cards" | "features" | "teams";
}) {
  function patch(partial: Partial<MarketingSite>) {
    onChange({ ...marketing, ...partial });
  }

  if (mode === "lists") {
    return (
      <Section title="Homepage steps & team cards">
        <p className="md:col-span-2 text-xs text-[var(--muted)]">
          These power the Steps and Teams sections on the marketing homepage.
        </p>
        {marketing.steps.map((step, i) => (
          <div key={i} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-2">
            <p className="md:col-span-2 text-sm font-bold text-[#0b3d38]">Step {i + 1}</p>
            <Field
              label="Title"
              value={step.title}
              onChange={(v) => {
                const steps = marketing.steps.map((s, idx) => (idx === i ? { ...s, title: v } : s));
                patch({ steps });
              }}
            />
            <Area
              label="Body"
              value={step.body}
              onChange={(v) => {
                const steps = marketing.steps.map((s, idx) => (idx === i ? { ...s, body: v } : s));
                patch({ steps });
              }}
            />
          </div>
        ))}
        <div className="md:col-span-2 flex gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => patch({ steps: [...marketing.steps, { title: "New step", body: "" }] })}
          >
            Add step
          </button>
          {marketing.steps.length > 1 && (
            <button
              type="button"
              className="btn"
              onClick={() => patch({ steps: marketing.steps.slice(0, -1) })}
            >
              Remove last step
            </button>
          )}
        </div>
        {marketing.teamCards.map((card, i) => (
          <div key={card.id + i} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-2">
            <p className="md:col-span-2 text-sm font-bold text-[#0b3d38]">Team card {i + 1}</p>
            <Field
              label="ID / slug"
              value={card.id}
              onChange={(v) => {
                const teamCards = marketing.teamCards.map((c, idx) => (idx === i ? { ...c, id: v } : c));
                patch({ teamCards });
              }}
            />
            <Field
              label="Title"
              value={card.title}
              onChange={(v) => {
                const teamCards = marketing.teamCards.map((c, idx) => (idx === i ? { ...c, title: v } : c));
                patch({ teamCards });
              }}
            />
            <Area
              label="Body"
              value={card.body}
              onChange={(v) => {
                const teamCards = marketing.teamCards.map((c, idx) => (idx === i ? { ...c, body: v } : c));
                patch({ teamCards });
              }}
            />
          </div>
        ))}
        <div className="md:col-span-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              patch({
                teamCards: [
                  ...marketing.teamCards,
                  { id: `team-${marketing.teamCards.length + 1}`, title: "New team", body: "" },
                ],
              })
            }
          >
            Add team card
          </button>
        </div>
        <p className="md:col-span-2 text-sm font-bold text-[#0b3d38]">Developers page blocks</p>
        {marketing.developersBlocks.map((block, i) => (
          <div key={i} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-2">
            <Field
              label="Title"
              value={block.title}
              onChange={(v) => {
                const developersBlocks = marketing.developersBlocks.map((b, idx) =>
                  idx === i ? { ...b, title: v } : b,
                );
                patch({ developersBlocks });
              }}
            />
            <Area
              label="Body"
              value={block.body}
              onChange={(v) => {
                const developersBlocks = marketing.developersBlocks.map((b, idx) =>
                  idx === i ? { ...b, body: v } : b,
                );
                patch({ developersBlocks });
              }}
            />
          </div>
        ))}
      </Section>
    );
  }

  if (mode === "faqs") {
    return (
      <Section title="Help / FAQ items">
        {marketing.faqs.map((faq, i) => (
          <div key={i} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4">
            <Field
              label={`Question ${i + 1}`}
              value={faq.q}
              onChange={(v) => {
                const faqs = marketing.faqs.map((f, idx) => (idx === i ? { ...f, q: v } : f));
                patch({ faqs });
              }}
            />
            <Area
              label="Answer"
              value={faq.a}
              onChange={(v) => {
                const faqs = marketing.faqs.map((f, idx) => (idx === i ? { ...f, a: v } : f));
                patch({ faqs });
              }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => patch({ faqs: marketing.faqs.filter((_, idx) => idx !== i) })}
            >
              Remove
            </button>
          </div>
        ))}
        <div className="md:col-span-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => patch({ faqs: [...marketing.faqs, { q: "New question?", a: "" }] })}
          >
            Add FAQ
          </button>
        </div>
      </Section>
    );
  }

  if (mode === "legal") {
    return (
      <Section title="Privacy & Terms body">
        <p className="md:col-span-2 text-xs text-[var(--muted)]">
          Use placeholders: {"{{brand}}"}, {"{{address}}"}, {"{{email}}"}. Separate paragraphs with a blank line.
        </p>
        <Area label="Privacy Policy body" value={marketing.privacyBody} onChange={(v) => patch({ privacyBody: v })} />
        <Area label="Terms & Conditions body" value={marketing.termsBody} onChange={(v) => patch({ termsBody: v })} />
      </Section>
    );
  }

  if (mode === "cards") {
    return (
      <Section title="About / Contact / Press cards">
        <CardList
          title="About cards"
          cards={marketing.aboutCards}
          onChange={(aboutCards) => patch({ aboutCards })}
        />
        <CardList
          title="Contact cards"
          cards={marketing.contactCards}
          onChange={(contactCards) => patch({ contactCards })}
        />
        <CardList
          title="Press cards"
          cards={marketing.pressCards}
          onChange={(pressCards) => patch({ pressCards })}
        />
      </Section>
    );
  }

  if (mode === "features") {
    return (
      <DetailPagesEditor
        title="Feature detail pages"
        pages={marketing.featurePages}
        onChange={(featurePages) => patch({ featurePages })}
      />
    );
  }

  return (
    <DetailPagesEditor
      title="Team detail pages"
      pages={marketing.teamPages}
      onChange={(teamPages) => patch({ teamPages })}
    />
  );
}

function CardList({
  title,
  cards,
  onChange,
}: {
  title: string;
  cards: TextCard[];
  onChange: (cards: TextCard[]) => void;
}) {
  return (
    <>
      <p className="md:col-span-2 text-sm font-bold text-[#0b3d38]">{title}</p>
      {cards.map((card, i) => (
        <div key={i} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-2">
          <Field
            label="Title"
            value={card.title}
            onChange={(v) => onChange(cards.map((c, idx) => (idx === i ? { ...c, title: v } : c)))}
          />
          <Field
            label="Link URL (optional)"
            value={card.href || ""}
            onChange={(v) => onChange(cards.map((c, idx) => (idx === i ? { ...c, href: v } : c)))}
          />
          <Area
            label="Body"
            value={card.body}
            onChange={(v) => onChange(cards.map((c, idx) => (idx === i ? { ...c, body: v } : c)))}
          />
          <Field
            label="Link label"
            value={card.linkLabel || ""}
            onChange={(v) => onChange(cards.map((c, idx) => (idx === i ? { ...c, linkLabel: v } : c)))}
          />
          <button type="button" className="btn" onClick={() => onChange(cards.filter((_, idx) => idx !== i))}>
            Remove card
          </button>
        </div>
      ))}
      <div className="md:col-span-2">
        <button
          type="button"
          className="btn"
          onClick={() => onChange([...cards, { title: "New card", body: "" }])}
        >
          Add {title.replace(" cards", "")} card
        </button>
      </div>
    </>
  );
}

function DetailPagesEditor({
  title,
  pages,
  onChange,
}: {
  title: string;
  pages: DetailPage[];
  onChange: (pages: DetailPage[]) => void;
}) {
  return (
    <Section title={title}>
      <p className="md:col-span-2 text-xs text-[var(--muted)]">
        Edit each page’s title, lead, and sections. Slug controls the URL (/features/slug or /teams/slug).
      </p>
      {pages.map((page, i) => (
        <div key={page.slug + i} className="md:col-span-2 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-2">
          <Field
            label="Slug"
            value={page.slug}
            onChange={(v) => onChange(pages.map((p, idx) => (idx === i ? { ...p, slug: v } : p)))}
          />
          <Field
            label="Kicker"
            value={page.kicker}
            onChange={(v) => onChange(pages.map((p, idx) => (idx === i ? { ...p, kicker: v } : p)))}
          />
          <Field
            label="Title"
            value={page.title}
            onChange={(v) => onChange(pages.map((p, idx) => (idx === i ? { ...p, title: v } : p)))}
          />
          <Area
            label="Lead"
            value={page.lead}
            onChange={(v) => onChange(pages.map((p, idx) => (idx === i ? { ...p, lead: v } : p)))}
          />
          {page.sections.map((sec, si) => (
            <div key={si} className="md:col-span-2 grid gap-2 rounded-lg border border-[var(--line)] p-3 md:grid-cols-2">
              <Field
                label={`Section ${si + 1} title`}
                value={sec.title}
                onChange={(v) =>
                  onChange(
                    pages.map((p, idx) =>
                      idx === i
                        ? {
                            ...p,
                            sections: p.sections.map((s, sidx) => (sidx === si ? { ...s, title: v } : s)),
                          }
                        : p,
                    ),
                  )
                }
              />
              <Area
                label="Section body"
                value={sec.body}
                onChange={(v) =>
                  onChange(
                    pages.map((p, idx) =>
                      idx === i
                        ? {
                            ...p,
                            sections: p.sections.map((s, sidx) => (sidx === si ? { ...s, body: v } : s)),
                          }
                        : p,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
      ))}
    </Section>
  );
}

// silence unused type imports if tree-shaken oddly
export type { FaqItem, StepItem, TeamCard };
