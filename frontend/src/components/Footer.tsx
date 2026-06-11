import { APP_NAME } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-muted)]">
        <div>
          © {new Date().getFullYear()} {APP_NAME}. Built for learners.
        </div>
        <div className="flex items-center gap-5">
          <span>Algebra</span>
          <span>Calculus</span>
          <span>Linear Algebra</span>
          <span>Statistics</span>
        </div>
      </div>
    </footer>
  );
}
