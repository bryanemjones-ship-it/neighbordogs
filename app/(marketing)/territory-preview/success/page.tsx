import Link from "next/link";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function TerritoryPreviewSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id?.trim();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
      <Link
        href="/"
        className="text-sm font-medium text-nd-collar transition hover:text-nd-text"
      >
        ← Back to homepage
      </Link>

      <div className="mt-8 rounded-2xl border border-nd-border bg-nd-card-cream/80 p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-nd-grass">
          Payment received
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-nd-text">
          Your territory is being activated.
        </h1>
        <p className="mt-4 leading-relaxed text-nd-text-soft">
          Stripe has confirmed checkout. NeighborDogs will reserve your area once
          the payment event is processed.
        </p>
        {sessionId ? (
          <p className="mt-4 text-xs text-nd-text-soft">
            Reference: {sessionId}
          </p>
        ) : null}
        <p className="mt-6 text-sm text-nd-text-soft">
          This usually takes a few seconds. You can check your dashboard once
          activation completes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-full bg-nd-grass px-6 text-sm font-semibold text-white transition hover:bg-nd-grass-dark"
          >
            Go to dashboard
          </Link>
          <Link
            href="/territory-preview"
            className="inline-flex h-11 items-center justify-center rounded-full border border-nd-border bg-white px-6 text-sm font-semibold text-nd-text transition hover:bg-nd-butter/30"
          >
            Territory preview
          </Link>
        </div>
      </div>
    </main>
  );
}
