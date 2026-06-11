"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Calculator, History, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-1 text-[var(--color-muted)]">
            Pick up where you left off.
          </p>
        </div>
        <Link
          href="/solve"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 font-medium transition-colors"
        >
          <Calculator className="w-4 h-4" />
          New problem
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
        <StatCard label="Problems solved" value="—" hint="Coming in Phase 7" />
        <StatCard label="Streak" value="—" hint="Coming in Phase 7" />
        <StatCard label="Topics covered" value="—" hint="Coming in Phase 7" />
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card
          icon={Calculator}
          title="Solve a problem"
          desc="Type, snap, or speak — get the answer with a clear walkthrough."
          href="/solve"
        />
        <Card
          icon={History}
          title="History"
          desc="Your saved solutions and recent activity. (Phase 7)"
          href="#"
          disabled
        />
      </div>

      <div className="mt-10 p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="font-semibold">You're on the early-access build</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              We&apos;re actively rolling out OCR for handwritten input, voice
              support, and an AI tutor that explains each step. Watch this space.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60">
      <div className="text-sm text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
      {hint && (
        <div className="mt-1 text-xs text-[var(--color-muted)]">{hint}</div>
      )}
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  desc,
  href,
  disabled,
}: {
  icon: typeof Calculator;
  title: string;
  desc: string;
  href: string;
  disabled?: boolean;
}) {
  const cls =
    "p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 transition-colors block";
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-300" />
        </div>
        {!disabled && (
          <ArrowRight className="w-4 h-4 text-[var(--color-muted)]" />
        )}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{desc}</p>
    </>
  );
  if (disabled) return <div className={`${cls} opacity-50`}>{content}</div>;
  return (
    <Link href={href} className={`${cls} hover:bg-[var(--color-surface)]`}>
      {content}
    </Link>
  );
}
