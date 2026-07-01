"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { AdminPanel } from "@/features/admin/components/AdminPanel";
import { supabase } from "@/shared/lib/supabase";

function DashboardContent() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      setSession(data.session);
      setCheckingSession(false);
    }

    verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <p className="text-sm text-[var(--color-text-muted)]">
          Checking session...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-header)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">
              NeighborDogs Admin
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {session?.user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-full border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-border-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              Operator Admin
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Schedule, customers, refunds, pricing, walkers, and testimonials —
              ported from the legacy admin suite.
            </p>
          </div>
          <AdminPanel />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center bg-background">
        <p className="text-sm text-[var(--color-text-muted)]">Loading dashboard…</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
