"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Log in to continue solving.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-[var(--color-muted)]">
          New here?{" "}
          <Link href="/signup" className="text-white hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm text-[var(--color-muted)]">{props.label}</span>
      <input
        type={props.type}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        required={props.required}
        minLength={props.minLength}
        className="mt-1 w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
      />
    </label>
  );
}
