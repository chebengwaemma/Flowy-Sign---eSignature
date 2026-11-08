"use client";

import { useState } from "react";

import { ChevronDown } from "lucide-react";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
import type { FaqItem } from "@/lib/marketing";

export function HelpFaq({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="lp-sub-body">
      <div className="lp-wrap" style={{ maxWidth: 860 }}>
        <ScrollMeetSplit className="lp-meet-stack" itemClassName="lp-meet-item" distance={100} stagger={0.06}>
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q + i} className="lp-faq-item">
                <button
                  type="button"
                  className="lp-faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={20} className={isOpen ? "open" : ""} />
                </button>
                {isOpen && <p className="lp-faq-a">{item.a}</p>}
              </div>
            );
          })}
        </ScrollMeetSplit>
      </div>
    </section>
  );
}
