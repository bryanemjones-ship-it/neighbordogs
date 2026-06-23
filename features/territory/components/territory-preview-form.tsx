"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/shared/lib/supabase";

const TerritoryMap = dynamic(
  () =>
    import("@/features/territory/components/territory-map").then((mod) => mod.TerritoryMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-nd-border bg-nd-card-cream/90 text-sm text-nd-text-soft">
        Loading map…
      </div>
    ),
  },
);

type TerritoryPreviewResponse = {
  ok: true;
  center_lat: number;
  center_lng: number;
  radius_miles: number;
  estimated_homes: number;
  estimated_dog_households: number;
  overlap_status: "available" | "adjusted" | "limited_overlap";
  max_overlap_ratio: number;
  is_smaller_fallback: boolean;
  opportunity_pct: number;
  monthly_cents: number;
  monthly_price: number;
  standard_monthly_price: number;
  anchor_address: string;
};

const overlapLabels: Record<TerritoryPreviewResponse["overlap_status"], string> =
  {
    available: "Available — no significant overlap",
    adjusted: "Available — center adjusted to avoid overlap",
    limited_overlap: "Limited — territory sized down due to overlap",
  };

function canSelfServeClaim(result: TerritoryPreviewResponse): boolean {
  return (
    !result.is_smaller_fallback &&
    result.monthly_cents === result.standard_monthly_price * 100
  );
}

export function TerritoryPreviewForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [result, setResult] = useState<TerritoryPreviewResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setClaimError(null);
    setResult(null);

    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setError("Enter an address to preview your territory.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/territory-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmedAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Territory preview failed.");
        return;
      }

      setResult(data as TerritoryPreviewResponse);
    } catch {
      setError("Could not reach the territory preview service.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim() {
    if (!result) {
      return;
    }

    setClaimError(null);
    setClaimLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login?next=/territory-preview");
        return;
      }

      const response = await fetch("/api/stripe/territory-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          address: address.trim() || result.anchor_address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setClaimError(data.error || "Could not start checkout.");
        return;
      }

      if (typeof data.url === "string" && data.url) {
        window.location.href = data.url;
        return;
      }

      setClaimError("Checkout URL was not returned.");
    } catch {
      setClaimError("Could not reach checkout.");
    } finally {
      setClaimLoading(false);
    }
  }

  const claimable = result ? canSelfServeClaim(result) : false;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
      <div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-nd-border bg-nd-card-cream/80 p-6 sm:p-8"
        >
        <label
          htmlFor="territory-name"
          className="block text-sm font-semibold text-nd-text"
        >
          Type your name here.
        </label>
        <input
          id="territory-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Papa Grande's Pooches"
          className="mt-2 w-full rounded-xl border border-nd-border bg-white px-4 py-3 text-sm text-nd-text outline-none ring-nd-collar/20 transition placeholder:text-nd-text-soft/60 focus:border-nd-collar focus:ring-2"
          autoComplete="name"
        />

        <label
          htmlFor="territory-address"
          className="mt-5 block text-sm font-semibold text-nd-text"
        >
          Address
        </label>
        <input
          id="territory-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="5324 Inglewood Lane, Raleigh, NC 27609"
          className="mt-2 w-full rounded-xl border border-nd-border bg-white px-4 py-3 text-sm text-nd-text outline-none ring-nd-collar/20 transition placeholder:text-nd-text-soft/60 focus:border-nd-collar focus:ring-2"
          autoComplete="street-address"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-nd-grass text-sm font-semibold text-white shadow-[0_3px_12px_rgba(79,167,107,0.22)] transition hover:bg-nd-grass-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Calculating…" : "Preview my territory"}
        </button>

        {error ? (
          <p className="mt-4 text-sm text-nd-coral">{error}</p>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-nd-text-soft">
            Uses census housing data and active territory overlap checks.
          </p>
        )}
        </form>

        {result ? (
          <div className="mt-8 w-full overflow-hidden rounded-xl border border-nd-border">
            <TerritoryMap
              lat={result.center_lat}
              lng={result.center_lng}
              radiusMiles={result.radius_miles}
              className="h-[400px] w-full"
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-nd-border bg-nd-sky/35 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-nd-text-soft">
            {result ? "Territory preview" : "Results"}
          </p>

          {!result && !loading ? (
            <p className="mt-2 text-sm text-nd-text-soft">
              Enter an address to see radius, estimated households, and
              availability.
            </p>
          ) : null}

          {loading ? (
            <p className="mt-4 text-sm text-nd-text-soft">
              Geocoding address and checking census data…
            </p>
          ) : null}

          {result ? (
            <>
              <p className="mt-2 text-sm text-nd-text">
                {result.anchor_address}
                {name.trim() ? (
                  <span className="text-nd-text-soft"> · {name.trim()}</span>
                ) : null}
              </p>

              <ul className="mt-5 space-y-3">
                <ResultRow
                  label="Territory radius"
                  value={`${result.radius_miles} miles`}
                  highlight
                />
                <ResultRow
                  label="Estimated households in territory"
                  value={result.estimated_homes.toLocaleString()}
                />
                <ResultRow
                  label="Estimated dog households"
                  value={`~${result.estimated_dog_households.toLocaleString()}`}
                />
                <ResultRow
                  label="Opportunity vs benchmark"
                  value={`${result.opportunity_pct}%`}
                />
                <ResultRow
                  label="Overlap status"
                  value={overlapLabels[result.overlap_status]}
                />
                <ResultRow
                  label="One operator per area"
                  value="Yes"
                />
                <ResultRow
                  label="Monthly price"
                  value={
                    result.monthly_price === result.standard_monthly_price
                      ? `$${result.standard_monthly_price}/month · No contract`
                      : `$${result.monthly_price.toFixed(2)}/month (adjusted) · Standard $${result.standard_monthly_price}`
                  }
                  highlight
                />
              </ul>

              {claimable ? (
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handleClaim}
                    disabled={claimLoading}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-nd-golden-deep text-sm font-semibold text-white transition hover:bg-nd-golden disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {claimLoading ? "Starting checkout…" : "Claim this territory"}
                  </button>
                  <p className="text-xs leading-relaxed text-nd-text-soft">
                    $149/month · No contract · Cancel anytime · Protected while
                    your subscription is active
                  </p>
                </div>
              ) : (
                <p className="mt-6 rounded-xl border border-nd-border bg-nd-butter/25 px-4 py-3 text-xs leading-relaxed text-nd-text-soft">
                  This adjusted territory needs a custom quote before checkout.
                  Contact NeighborDogs to claim it at the adjusted rate.
                </p>
              )}

              {claimError ? (
                <p className="mt-4 text-sm text-nd-coral">{claimError}</p>
              ) : null}
            </>
          ) : null}
        </div>

        <p className="rounded-xl border border-nd-border bg-nd-butter/25 px-4 py-3 text-xs leading-relaxed text-nd-text-soft">
          Your preview is based on local density and opportunity, not just a
          circle around an address.
        </p>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <li className="rounded-xl border border-nd-border bg-nd-card-cream/90 px-4 py-3">
      <p className="text-xs font-semibold text-nd-text-soft">{label}</p>
      <p
        className={`mt-1 text-sm font-medium ${highlight ? "text-nd-golden-deep" : "text-nd-text"}`}
      >
        {value}
      </p>
    </li>
  );
}
