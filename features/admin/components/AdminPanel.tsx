"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApprovalsPanel } from "./panels/ApprovalsPanel";
import { PricingPanel } from "./panels/PricingPanel";
import { RefundsPanel } from "./panels/RefundsPanel";
import { SchedulePanel } from "./panels/SchedulePanel";
import { TestimonialsPanel } from "./panels/TestimonialsPanel";
import { WalkersPanel } from "./panels/WalkersPanel";
import { WeeklyPanel } from "./panels/WeeklyPanel";
import "./admin.css";

export type AdminTab =
  | "schedule"
  | "approvals"
  | "refunds"
  | "weekly"
  | "pricing"
  | "walkers"
  | "testimonials";

const ADMIN_TABS: { id: AdminTab; label: string }[] = [
  { id: "schedule", label: "Today's Schedule" },
  { id: "approvals", label: "Customers" },
  { id: "refunds", label: "Cancellations & Refunds" },
  { id: "weekly", label: "Weekly Packages" },
  { id: "pricing", label: "Pricing" },
  { id: "walkers", label: "Walkers" },
  { id: "testimonials", label: "Testimonials" },
];

type ToastState = { title: string; message: string } | null;

export function AdminPanel() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const validInitialTab = ADMIN_TABS.some((tab) => tab.id === initialTab)
    ? (initialTab as AdminTab)
    : "schedule";

  const [activeTab, setActiveTab] = useState<AdminTab>(validInitialTab);
  const [toast, setToast] = useState<ToastState>(null);
  const [scheduleKey, setScheduleKey] = useState(0);
  const [weeklyKey, setWeeklyKey] = useState(0);
  const [pricingKey, setPricingKey] = useState(0);
  const [walkersKey, setWalkersKey] = useState(0);
  const [testimonialsKey, setTestimonialsKey] = useState(0);
  const [approvalsKey, setApprovalsKey] = useState(0);

  const showToast = useCallback((title: string, message: string) => {
    setToast({ title, message });
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  function showAdminPanel(which: AdminTab) {
    setActiveTab(which);
    if (which === "schedule") setScheduleKey((k) => k + 1);
    if (which === "approvals") setApprovalsKey((k) => k + 1);
    if (which === "weekly") setWeeklyKey((k) => k + 1);
    if (which === "pricing") setPricingKey((k) => k + 1);
    if (which === "walkers") setWalkersKey((k) => k + 1);
    if (which === "testimonials") setTestimonialsKey((k) => k + 1);
  }

  async function changeAdminPin() {
    const current = window.prompt("Enter your current PIN first.");
    if (!current) return;
    const pin1 = window.prompt("Enter your new PIN (at least 4 characters).");
    if (!pin1 || pin1.length < 4) {
      showToast("Too Short", "PIN must be at least 4 characters.");
      return;
    }
    const pin2 = window.prompt("Enter it again to confirm.");
    if (pin1 !== pin2) {
      showToast("Mismatch", "PINs don't match.");
      return;
    }
    try {
      localStorage.setItem("rdgw_admin_pin_hash", pin1);
      showToast("PIN Updated", "Your admin PIN has been changed.");
    } catch {
      showToast("Error", "Could not change PIN.");
    }
  }

  return (
    <div className="legacy-admin">
      <div className="card stack">
        <div className="muted">
          Manage your schedule, customers, and bookings.
        </div>
        <div id="adminArea">
          <div className="hr" />
          <div
            className="row"
            style={{ gap: 10, flexWrap: "wrap" }}
            id="adminBtnRow"
          >
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn admin-tab-btn${activeTab === tab.id ? " primary" : ""}`}
                data-panel={tab.id}
                onClick={() => showAdminPanel(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            <button type="button" className="btn" onClick={() => void changeAdminPin()}>
              Change PIN
            </button>
          </div>

          {activeTab === "schedule" ? (
            <SchedulePanel key={scheduleKey} showToast={showToast} />
          ) : null}
          {activeTab === "approvals" ? (
            <ApprovalsPanel key={approvalsKey} showToast={showToast} />
          ) : null}
          {activeTab === "refunds" ? (
            <RefundsPanel showToast={showToast} />
          ) : null}
          {activeTab === "weekly" ? (
            <WeeklyPanel key={weeklyKey} showToast={showToast} />
          ) : null}
          {activeTab === "pricing" ? (
            <PricingPanel key={pricingKey} showToast={showToast} />
          ) : null}
          {activeTab === "walkers" ? (
            <WalkersPanel key={walkersKey} showToast={showToast} />
          ) : null}
          {activeTab === "testimonials" ? (
            <TestimonialsPanel key={testimonialsKey} showToast={showToast} />
          ) : null}
        </div>
      </div>

      {toast ? (
        <div className="legacy-admin-toast">
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
        </div>
      ) : null}
    </div>
  );
}
