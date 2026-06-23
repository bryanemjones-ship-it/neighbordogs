"use client";

import type { DemoIdentity } from "@/features/marketing/lib/demo-identity";
import { GeneratedBookingPreview } from "./generated-booking-preview";
import { PawBullet } from "./icons";
import { SectionBand } from "./section-band";

type SampleWebsiteGeneratorProps = {
  demoIdentity: DemoIdentity;
  onInputChange: (value: string) => void;
};

export function SampleWebsiteGenerator({
  demoIdentity,
  onInputChange,
}: SampleWebsiteGeneratorProps) {
  const { demoInputName, demoBusinessName, demoUrl } = demoIdentity;

  return (
    <SectionBand id="preview" tone="sky" className="scroll-mt-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
            See what your clients will see.
          </h2>
          <p className="mt-2 text-sm text-nd-text-soft">
            Type your name. Watch your client page appear.
          </p>

          <label
            htmlFor="business-name-preview"
            className="mt-6 block text-sm font-bold text-nd-text"
          >
            Type your name here.
          </label>
          <input
            id="business-name-preview"
            type="text"
            value={demoInputName}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Papa Grande's Pooches"
            className="mt-2 w-full rounded-2xl border-2 border-nd-collar/25 bg-nd-card-cream px-4 py-3.5 text-base text-nd-text shadow-sm outline-none transition placeholder:text-nd-text-soft/50 focus:border-nd-collar focus:ring-2 focus:ring-nd-collar/20"
            autoComplete="off"
          />
          <p className="mt-2 text-xs text-nd-text-soft">
            We&apos;ll turn it into a clean client website name.
          </p>

          <div className="mt-5 rounded-2xl border-2 border-nd-golden/30 bg-nd-butter/40 px-4 py-3 shadow-sm">
            <p className="text-base font-bold text-nd-text">{demoBusinessName}</p>
            <p className="mt-1 break-all font-mono text-sm text-nd-collar">
              {demoUrl}
            </p>
          </div>

          <p className="mt-4 flex items-center gap-2 text-sm text-nd-text-soft">
            <PawBullet className="text-nd-golden" />
            Put your name in and see your business come to life.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 lg:items-end">
          <span className="animate-pulse rounded-full bg-nd-golden/20 px-3 py-1 text-xs font-bold text-nd-golden-deep">
            ✦ Live preview
          </span>
          <GeneratedBookingPreview
            businessName={demoBusinessName}
            variant="mobile"
          />
          <div className="hidden xl:block xl:w-full xl:max-w-none">
            <GeneratedBookingPreview
              businessName={demoBusinessName}
              variant="desktop"
            />
          </div>
        </div>
      </div>
    </SectionBand>
  );
}
