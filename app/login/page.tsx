"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";

type AuthMode = "login" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = searchParams.get("next") || "/";
  const safeReturnPath =
    returnPath.startsWith("/") && !returnPath.startsWith("//") ? returnPath : "/";

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(safeReturnPath);
      router.refresh();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push(safeReturnPath);
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
    setMode("login");
    setPassword("");
    setLoading(false);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage(null);
    setError(null);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-16">
      <main className="w-full max-w-md rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {mode === "login"
              ? "Welcome back to NeighborDogs."
              : "Start managing your dog walking business."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-input)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-new-soft)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-input)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-new-soft)]"
              placeholder="At least 6 characters"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-[var(--color-danger-soft)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]"
            >
              {error}
            </p>
          ) : null}

          {message ? (
            <p
              role="status"
              className="rounded-lg border border-[var(--color-success-soft)] bg-[var(--color-success-soft)] px-3 py-2 text-sm text-[var(--color-success)]"
            >
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center rounded-full bg-new px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="font-medium text-[var(--color-text)] underline-offset-4 hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-medium text-[var(--color-text)] underline-offset-4 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-text-secondary)] hover:underline"
          >
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
