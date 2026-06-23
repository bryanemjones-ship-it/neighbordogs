"use client";

import { useState } from "react";
import { deriveDemoIdentity, DEFAULT_SAMPLE_NAME } from "@/features/marketing/lib/demo-identity";
import { ClientDemoCard } from "./client-demo-card";
import { AdminDemoCard } from "./admin-demo-card";

type DemoTab = "client" | "admin";

const clientBullets = [
  "Local booking page with your business name",
  "20 / 30 / 60 min walks and recurring schedule",
  "Saved payment, confirmation, and reminders",
  "GPS route, photos, potty/water/food checklist",
  "Walker note and client update after each walk",
];

const adminBullets = [
  "Today's schedule and walk status at a glance",
  "Client list, dog profiles, and visit history",
  "GPS tracking, payments, and reminders",
  "Report cards, route notes, and client updates",
  "Simple business records — no spreadsheet chaos",
];

export function ProductDemo() {
  const [tab, setTab] = useState<DemoTab>("client");
  const fallbackBusinessName = deriveDemoIdentity(DEFAULT_SAMPLE_NAME).demoBusinessName;

  return (
    <section id="demo" className="mt-16 scroll-mt-24">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
          See what the business looks like.
        </h2>
        <p className="mt-3 text-nd-text-soft">
          The same product your clients book on — and the dashboard you run it
          from. Inspired by the full NeighborDogs app, shown here as static
          previews.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            { id: "client" as const, label: "What clients see" },
            { id: "admin" as const, label: "What you see" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
              tab === item.id
                ? "bg-nd-text text-nd-card-cream"
                : "border border-nd-border bg-nd-card-cream text-nd-text-soft hover:text-nd-text"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          {tab === "client" ? (
            <ClientDemoCard businessName={fallbackBusinessName} />
          ) : (
            <AdminDemoCard />
          )}
        </div>

        <div className="flex flex-col justify-center">
          {tab === "client" ? (
            <>
              <p className="text-lg leading-relaxed text-nd-text">
                Clients do not see &ldquo;software.&rdquo; They see a clean
                booking page, reliable reminders, and a professional report
                after every walk.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-nd-text-soft">
                {clientBullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="font-bold text-nd-grass">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="text-lg leading-relaxed text-nd-text">
                You see the day, the dogs, the payments, and the follow-up in
                one place. No spreadsheet chaos. No forgotten texts.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-nd-text-soft">
                {adminBullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="font-bold text-nd-grass">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
