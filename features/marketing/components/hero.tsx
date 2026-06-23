import Link from "next/link";
import { TerritoryCta } from "@/features/territory/components/territory-cta";
import { HeroProductVisual } from "./hero-product-visual";
import { SectionBand } from "./section-band";
import { DogTagIcon } from "./icons";

export function Hero() {
  return (
    <SectionBand tone="butter" className="scroll-mt-24">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-nd-golden/30 bg-nd-card-cream/80 px-3 py-1 text-xs font-semibold text-nd-golden-deep">
            <DogTagIcon className="h-4 w-3" />
            Your first real business can start with a leash.
          </span>
          <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.06] tracking-tight text-nd-text sm:text-5xl">
            Turn dog walking into a real neighborhood business.
          </h1>
          <p className="mt-5 max-w-lg text-xl leading-relaxed text-nd-text">
            Start with a leash, a phone, and a neighborhood. NeighborDogs gives
            you the rest.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <TerritoryCta />
            <Link
              href="#preview"
              className="inline-flex h-12 items-center justify-center rounded-full border-2 border-nd-collar/30 bg-nd-card-cream px-7 text-sm font-semibold text-nd-collar transition hover:border-nd-collar hover:bg-nd-sky/50"
            >
              Type your name
            </Link>
          </div>

          <p className="mt-6 text-sm font-semibold text-nd-text">
            $149/month ·{" "}
            <span className="text-nd-grass">No contract</span> · No franchise
            fee · No cut of your walks
          </p>
        </div>

        <HeroProductVisual />
      </div>
    </SectionBand>
  );
}
