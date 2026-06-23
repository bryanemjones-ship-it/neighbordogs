"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { AdminPanel } from "@/features/admin/components/AdminPanel";
import { supabase } from "@/shared/lib/supabase";

export default function DashboardPage() {
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
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Checking session...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              NeighborDogs Admin
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {session?.user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-[#1a1a1a]"
          >
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Operator Admin
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
