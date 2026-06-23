"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadTestimonials,
  saveTestimonials,
  type LegacyTestimonial,
} from "@/features/booking/lib/models";

type TestimonialsPanelProps = {
  showToast: (title: string, message: string) => void;
};

export function TestimonialsPanel({ showToast }: TestimonialsPanelProps) {
  const [items, setItems] = useState<LegacyTestimonial[]>([]);

  const loadAdminTestimonials = useCallback(() => {
    setItems(loadTestimonials());
  }, []);

  useEffect(() => {
    loadAdminTestimonials();
  }, [loadAdminTestimonials]);

  function addTestimonial() {
    const name = window.prompt("Customer name (e.g. 'Sarah M.'):");
    if (!name) return;
    const dogs = window.prompt("Dog name(s) (optional):");
    const text = window.prompt("Testimonial text:");
    if (!text) return;
    const stars = parseInt(window.prompt("Stars (1-5):", "5") || "5", 10) || 5;
    const next = [...loadTestimonials(), { name, dogs: dogs || "", text, stars }];
    saveTestimonials(next);
    setItems(next);
    showToast("Added", "Testimonial added.");
  }

  function deleteTestimonial(idx: number) {
    if (!window.confirm("Delete this testimonial?")) return;
    const next = loadTestimonials().filter((_, i) => i !== idx);
    saveTestimonials(next);
    setItems(next);
    showToast("Deleted", "Testimonial removed.");
  }

  return (
    <div id="adminPanelTestimonials" className="stack">
      <div className="card stack">
        <div className="field-label">TESTIMONIALS</div>
        <div className="muted">
          These appear on the home screen for all visitors. Add real reviews from
          your customers.
        </div>
        <button
          type="button"
          className="btn primary"
          style={{ alignSelf: "flex-start" }}
          onClick={addTestimonial}
        >
          + Add Testimonial
        </button>
        <div id="adminTestimonialsList" className="stack" style={{ gap: 8 }}>
          {!items.length ? (
            <div className="muted">No testimonials yet. Add your first one!</div>
          ) : (
            items.map((t, i) => (
              <div key={`${t.name}-${i}`} className="card" style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 13, lineHeight: 1.4, marginBottom: 6 }}>
                  &quot;{t.text}&quot;
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {t.name}{" "}
                  {t.dogs ? <span className="muted">· {t.dogs}</span> : null}{" "}
                  {"⭐".repeat(Math.min(t.stars || 5, 5))}
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: 12, padding: "4px 10px" }}
                    onClick={() => deleteTestimonial(i)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
