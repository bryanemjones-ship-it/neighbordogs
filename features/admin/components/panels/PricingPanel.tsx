"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadPrices,
  savePrices,
  type LegacyPrices,
} from "@/features/booking/lib/models";
import {
  buddyPreview,
  pricingPreview,
  withWeeklyComputed,
} from "@/features/booking/lib/pricing-helpers";

type PricingPanelProps = {
  showToast: (title: string, message: string) => void;
};

export function PricingPanel({ showToast }: PricingPanelProps) {
  const [prices, setPrices] = useState<LegacyPrices>(() => loadPrices());
  const [pricingMsg, setPricingMsg] = useState("");

  const adminLoadPricing = useCallback(() => {
    setPrices(loadPrices());
  }, []);

  useEffect(() => {
    adminLoadPricing();
  }, [adminLoadPricing]);

  function updateField<K extends keyof LegacyPrices>(key: K, value: number) {
    setPrices((prev) => ({ ...prev, [key]: value }));
  }

  function adminSavePricing() {
    setPricingMsg("Saving…");
    const computed = withWeeklyComputed(prices);
    savePrices(computed);
    setPrices(computed);
    setPricingMsg("");
    showToast("Saved", "Pricing updated for all customers.");
  }

  return (
    <div id="adminPanelPricing" className="stack">
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
      <button type="button" className="btn primary full" onClick={adminSavePricing}>
        Save Pricing
      </button>
      <div id="adminPricingMsg" className="muted">
        {pricingMsg}
      </div>
    </div>
  );
}
