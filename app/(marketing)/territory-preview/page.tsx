import Link from "next/link";
import { FairTerritoriesSection } from "@/features/territory/components/fair-territories-section";
import { TerritoryPreviewForm } from "@/features/territory/components/territory-preview-form";

type TerritoryPreviewPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

export default async function TerritoryPreviewPage({
  searchParams,
}: TerritoryPreviewPageProps) {
  const params = await searchParams;
  const checkoutCancelled = params.checkout === "cancelled";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
      <div className="max-w-2xl">
        <Link
          href="/"
          className="text-sm font-medium text-nd-collar transition hover:text-nd-text"
        >
          ← Back to homepage
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-nd-text sm:text-4xl">
          Check your territory.
        </h1>
        <p className="mt-4 leading-relaxed text-nd-text-soft">
          Enter your address. NeighborDogs will show whether your area is
          available and estimate the local opportunity.
        </p>
        {checkoutCancelled ? (
          <p className="mt-4 rounded-xl border border-nd-border bg-nd-butter/25 px-4 py-3 text-sm text-nd-text-soft">
            Checkout was cancelled. Your territory preview is still available
            below when you are ready to claim it.
          </p>
        ) : null}
      </div>

      <div className="mt-10">
        <TerritoryPreviewForm />
      </div>

      <div className="mt-12">
        <FairTerritoriesSection compact />
      </div>
    </main>
  );
}
