"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_SAMPLE_NAME,
  deriveDemoIdentity,
} from "@/features/marketing/lib/demo-identity";
import { Hero } from "@/features/marketing/components/hero";
import { SampleWebsiteGenerator } from "@/features/marketing/components/sample-website-generator";
import { OperatorTodayDemo } from "@/features/marketing/components/operator-today-demo";
import { ClientBookingDemo } from "@/features/marketing/components/client-booking-demo";
import { OhCrapSection } from "@/features/marketing/components/oh-crap-section";
import { IncomeExample } from "@/features/marketing/components/income-example";
import { GrowthPathSection } from "@/features/marketing/components/growth-path-section";
import { InsuranceTrustSection } from "@/features/marketing/components/insurance-trust-section";
import { FAQSection } from "@/features/marketing/components/faq-section";
import { PricingCTA } from "@/features/marketing/components/pricing-cta";
import { FinalCTA } from "@/features/marketing/components/final-cta";
import { RouteDivider, SectionBand } from "@/features/marketing/components/section-band";

export function MarketingHome() {
  const [demoInputName, setDemoInputName] = useState(DEFAULT_SAMPLE_NAME);
  const demoIdentity = useMemo(
    () => deriveDemoIdentity(demoInputName),
    [demoInputName],
  );

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-0 pt-6 sm:px-6 sm:pt-8">
        <Hero />
        <SampleWebsiteGenerator
          demoIdentity={demoIdentity}
          onInputChange={setDemoInputName}
        />
        <OperatorTodayDemo businessName={demoIdentity.demoBusinessName} />
        <ClientBookingDemo businessName={demoIdentity.demoBusinessName} />
        <OhCrapSection />
        <IncomeExample />
        <GrowthPathSection />
        <RouteDivider />
      </main>

      <SectionBand tone="cream" className="pb-2">
        <div className="space-y-10">
          <InsuranceTrustSection />
          <FAQSection />
          <PricingCTA />
        </div>
      </SectionBand>

      <FinalCTA demoIdentity={demoIdentity} />

      <footer className="mx-auto max-w-6xl px-5 pb-10 pt-6 text-center text-xs text-nd-text-soft sm:px-6">
        <p>NeighborDogs — your first real local dog walking business.</p>
      </footer>
    </>
  );
}
