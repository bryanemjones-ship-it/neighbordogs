"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is this a franchise?",
    a: "No. No franchise fee and no cut of your walks — $149/month for your territory and tools.",
  },
  {
    q: "What if I have never started a business before?",
    a: "Most people start here. NeighborDogs handles booking, schedule, payments, and report cards.",
  },
  {
    q: "How do clients book me?",
    a: "Your booking page. They pick a walk, choose their dog, and request a time.",
  },
  {
    q: "What if someone already has my area?",
    a: "Territory preview shows availability before you commit. One operator per area.",
  },
  {
    q: "Is there a contract?",
    a: "No. NeighborDogs is month to month. Your territory is reserved while your subscription is active.",
  },
  {
    q: "Do I need insurance?",
    a: "Yes — your own general liability policy before serving clients. NeighborDogs does not provide coverage.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24">
      <h2 className="text-xl font-bold text-nd-text">
        Real questions. Straight answers.
      </h2>

      <div className="mt-4 grid gap-x-8 md:grid-cols-2">
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className="border-b border-nd-border/70">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-start justify-between gap-3 py-3 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-nd-text">
                  {item.q}
                </span>
                <span className="shrink-0 text-nd-golden">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen ? (
                <p className="pb-3 text-sm leading-relaxed text-nd-text-soft">
                  {item.a}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
