"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PublicBookingOperator } from "@/features/booking/lib/operator-resolve";
import { ClientBookingFlow } from "@/features/booking/components/ClientBookingFlow";
import "./client-booking.css";

type OperatorBookingPageProps = {
  operator: PublicBookingOperator;
};

type BookingView = "entry" | "new" | "returning";

export function OperatorBookingPage({ operator }: OperatorBookingPageProps) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<BookingView>("entry");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setCheckoutMessage(
        "Payment received! Your walk is booked and pending operator confirmation.",
      );
      setView("entry");
    } else if (checkout === "cancelled") {
      setCheckoutMessage("Checkout was cancelled. You can try again when ready.");
      setView("entry");
    }
  }, [searchParams]);

  if (view === "new") {
    const businessLabel = operator.fullName || "your local operator";

    return (
      <div className="client-booking legacy-admin">
        <div className="subnav">
          <button type="button" className="btn back" onClick={() => setView("entry")}>
            ←
          </button>
          <span className="icon">🐕</span>
          <h2>New Customer</h2>
        </div>

        <p className="muted" style={{ margin: "0 0 16px" }}>
          with {businessLabel}
        </p>

        <div className="card stack">
          <p className="muted" style={{ margin: 0 }}>
            New customer setup is coming soon.
          </p>
        </div>
      </div>
    );
  }

  if (view === "returning") {
    return (
      <ClientBookingFlow
        prices={operator.prices}
        operatorName={operator.fullName}
        operatorSlug={operator.slug}
        operatorId={operator.id}
        onBack={() => setView("entry")}
      />
    );
  }

  const businessLabel = operator.fullName || "your local operator";

  return (
    <div className="client-booking legacy-admin">
      <div className="subnav">
        <a href="/" className="btn back" style={{ textDecoration: "none" }}>
          ←
        </a>
        <span className="icon">🐕</span>
        <h2>Book a Walk</h2>
      </div>

      <p className="muted" style={{ margin: "0 0 16px" }}>
        with {businessLabel}
      </p>

      {checkoutMessage ? (
        <div className="card success-banner" style={{ marginBottom: 16 }}>
          <p className="muted" style={{ margin: 0 }}>
            {checkoutMessage}
          </p>
        </div>
      ) : null}

      <p
        className="muted tiny"
        style={{
          margin: "0 0 12px",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 700,
        }}
      >
        Get Started
      </p>

      <div className="stack" style={{ gap: 10 }}>
        <button
          type="button"
          className="btn full"
          style={{ textAlign: "left", padding: "16px 18px", height: "auto" }}
          onClick={() => setView("new")}
        >
          <strong>New Customer</strong>
          <span
            className="muted tiny"
            style={{ display: "block", marginTop: 4, fontWeight: 400 }}
          >
            New customer setup is coming soon.
          </span>
        </button>

        <button
          type="button"
          className="btn primary full"
          style={{ textAlign: "left", padding: "16px 18px", height: "auto" }}
          onClick={() => setView("returning")}
        >
          <strong>Returning Customer</strong>
          <span
            className="muted tiny"
            style={{ display: "block", marginTop: 4, fontWeight: 400 }}
          >
            Book a walk with your saved profile
          </span>
        </button>
      </div>
    </div>
  );
}
