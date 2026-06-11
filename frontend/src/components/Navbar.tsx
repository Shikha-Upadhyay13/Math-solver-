"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME } from "@/lib/config";
import { Sigma, LogOut, ChevronDown } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLink = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`px-3 py-2 rounded-md text-sm transition-colors ${
          active
            ? "text-white bg-white/5"
            : "text-[var(--color-muted)] hover:text-white hover:bg-white/5"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[rgba(10,11,20,0.6)] border-b border-[var(--color-border)]">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sigma className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-white">
            {APP_NAME}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLink("/", "Home")}
          {navLink("/solve", "Solve")}
          {user && navLink("/dashboard", "Dashboard")}
        </div>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 transition-colors"
              >
                Get started
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-semibold">
                  {(user.name?.[0] ?? user.email[0]).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm">
                  {user.name ?? user.email.split("@")[0]}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl py-1"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-3 py-2 text-xs text-[var(--color-muted)] border-b border-[var(--color-border)]">
                    Signed in as
                    <div className="text-white truncate mt-0.5">{user.email}</div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-sm hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-white/5 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
