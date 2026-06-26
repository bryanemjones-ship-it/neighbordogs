"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchOperatorPrices,
  upsertOperatorPrices,
} from "@/features/booking/lib/operator-prices";
import { DEFAULT_PRICES, type LegacyPrices } from "@/features/booking/lib/models";
import {
  buddyPreview,
  pricingPreview,
  withWeeklyComputed,
} from "@/features/booking/lib/pricing-helpers";
import { supabase } from "@/shared/lib/supabase";

type PricingPanelProps = {
  showToast: (title: string, message: string) => void;
};

export function PricingPanel({ showToast }: PricingPanelProps) {
  const [prices, setPrices] = useState<LegacyPrices>(DEFAULT_PRICES);
  const [pricingMsg, setPricingMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectMsg, setConnectMsg] = useState("");
  const [stripeConnected, setStripeConnected] = useState(false);

  const adminLoadPricing = useCallback(async () => {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      return;
    }

    const [loaded, profileResult] = await Promise.all([
      fetchOperatorPrices(supabase, user.id),
      supabase
        .from("profiles")
        .select("stripe_connect_id")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    setPrices(loaded);
    setStripeConnected(Boolean(profileResult.data?.stripe_connect_id));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void adminLoadPricing();
  }, [adminLoadPricing]);

  function updateField<K extends keyof LegacyPrices>(key: K, value: number) {
    setPrices((prev) => ({ ...prev, [key]: value }));
  }

  async function adminSavePricing() {
    setPricingMsg("Saving…");
    const computed = withWeeklyComputed(prices);
    setPrices(computed);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPricingMsg("Error: You must be logged in.");
      return;
    }

    const { error } = await upsertOperatorPrices(supabase, user.id, computed);

    if (error) {
      console.error("Supabase upsert error:", error);
      setPricingMsg("Failed to save to database.");
      return;
    }

    setPricingMsg("");
    showToast("Saved", "Pricing updated for all customers.");
  }

  async function startStripeConnect() {
    setConnectMsg("");
    setConnectLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setConnectMsg("You must be logged in.");
        return;
      }

      const response = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setConnectMsg(data.error || "Could not start Stripe Connect setup.");
        return;
      }

      if (typeof data.url === "string" && data.url) {
        window.location.href = data.url;
        return;
      }

      setConnectMsg("Stripe did not return an onboarding URL.");
    } catch {
      setConnectMsg("Could not reach Stripe Connect.");
    } finally {
      setConnectLoading(false);
    }
  }

  return (
    <div id="adminPanelPricing" className="stack">
      <div className="card stack">
        <div className="field-label">STRIPE CONNECT PAYOUTS</div>
        <div className="muted" style={{ fontSize: 14 }}>
          Connect your Stripe account to receive client walk payments. Required
          before walk checkout goes live.
        </div>
        {stripeConnected ? (
          <p className="muted tiny">Connected to Stripe.</p>
        ) : (
          <p className="muted tiny">Not connected yet.</p>
        )}
        <button
          type="button"
          className="btn primary full"
          onClick={startStripeConnect}
          disabled={isLoading || connectLoading}
        >
          {connectLoading
            ? "Redirecting to Stripe…"
            : stripeConnected
              ? "Update Stripe Connect setup"
              : "Connect Stripe account"}
        </button>
        {connectMsg ? <p className="muted tiny">{connectMsg}</p> : null}
      </div>
      <div className="card stack">
        <div className="field-label">REGULAR WALK PRICES</div>
        <div className="two">
          <div className="stack">
            <label style={{ fontSize: 15, fontWeight: 600 }}>20 min</label>
            <input
              id="price20"
              type="number"
              step={0.01}
              min={0}
              value={prices.w20}
              disabled={isLoading}
              onChange={(e) => updateField("w20", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="stack">
            <label style={{ fontSize: 15, fontWeight: 600 }}>30 min</label>
            <input
              id="price30"
              type="number"
              step={0.01}
              min={0}
              value={prices.w30}
              disabled={isLoading}
              onChange={(e) => updateField("w30", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="two">
          <div className="stack">
            <label style={{ fontSize: 15, fontWeight: 600 }}>60 min</label>
            <input
              id="price60"
              type="number"
              step={0.01}
              min={0}
              value={prices.w60}
              disabled={isLoading}
              onChange={(e) => updateField("w60", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="stack">
            <label style={{ fontSize: 15, fontWeight: 600 }}>Emergency</label>
            <input
              id="priceEmergency"
              type="number"
              step={0.01}
              min={0}
              value={prices.emergency}
              disabled={isLoading}
              onChange={(e) =>
                updateField("emergency", parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>
      </div>
      <div className="card stack">
        <div className="field-label">WEEKLY PACKAGE DISCOUNT</div>
        <div className="muted" style={{ fontSize: 14 }}>
          Percentage off regular prices for weekly packages (min 2 days).
        </div>
        <div className="row" style={{ alignItems: "center", gap: 10 }}>
          <input
            id="weeklyDiscount"
            type="number"
            step={1}
            min={0}
            max={50}
            style={{ width: 100 }}
            value={prices.weeklyDiscount}
            disabled={isLoading}
            onChange={(e) =>
              updateField("weeklyDiscount", parseInt(e.target.value, 10) || 0)
            }
          />
          <span className="muted">%</span>
        </div>
        <div id="pricingPreview" className="muted tiny" style={{ marginTop: 4 }}>
          {pricingPreview(prices)}
        </div>
      </div>
      <div className="card stack">
        <div className="field-label">BUDDY WALK ADD-ON</div>
        <div className="muted" style={{ fontSize: 14 }}>
          Per additional dog from the same household (max 3 dogs total).
        </div>
        <div className="row" style={{ alignItems: "center", gap: 10 }}>
          <span className="muted">+$</span>
          <input
            id="priceBuddyAddon"
            type="number"
            step={1}
            min={0}
            max={50}
            style={{ width: 100 }}
            value={prices.buddyAddon}
            disabled={isLoading}
            onChange={(e) =>
              updateField("buddyAddon", parseFloat(e.target.value) || 0)
            }
          />
          <span className="muted">per extra dog</span>
        </div>
        <div id="buddyPreview" className="muted tiny" style={{ marginTop: 4 }}>
          {buddyPreview(prices)}
        </div>
      </div>
      <button
        type="button"
        className="btn primary full"
        onClick={adminSavePricing}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Save Pricing"}
      </button>
      <div id="adminPricingMsg" className="muted">
        {pricingMsg}
      </div>
    </div>
  );
}
