"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How to send a document for signature?",
    a: "Click Sign documents, upload your file, add signers, place fields, and send. Recipients get a secure link.",
  },
  {
    q: "How to send a fax online?",
    a: "Open Send fax, enter the destination number, attach your document, and queue the fax from your workspace.",
  },
  {
    q: "What is the Flowy Sign API?",
    a: "A REST API to create signature requests and automate fax workflows from your own product.",
  },
  {
    q: "Is my data secure?",
    a: "Requests travel over encrypted connections and include an audit trail you can review anytime.",
  },
  {
    q: "Where are you based?",
    a: "Flowy Sign - eSignature is based in Austell, GA, USA.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="lp-faq-item">
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
    </div>
  );
}
