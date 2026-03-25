"use client";

import { ArrowRight, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { APP_NAME } from "@/config/constants";

const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Community", href: "/community" },
  { label: "Docs", href: "/docs" },
];

export function LandingHeader() {
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("landing-theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("landing-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("landing-theme", "light");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stone-200/60 bg-[#fafaf9]/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#09090b]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 shadow-md shadow-teal-500/25 dark:from-white dark:via-white dark:to-white dark:shadow-white/10">
              <Sparkles className="h-4 w-4 text-white dark:text-stone-900" />
            </div>
            <span className="font-display text-[17px] font-bold tracking-tight text-stone-900 dark:text-white">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-white/10 dark:hover:text-white"
              title={dark ? "Light mode" : "Dark mode"}
            >
              {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              href="/login"
              className="hidden rounded-lg px-4 py-2 text-[13px] font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="group hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2 text-[13px] font-semibold text-white shadow-md shadow-teal-500/20 transition-all hover:shadow-lg hover:shadow-teal-500/30 hover:brightness-110 active:scale-[0.98] sm:flex"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-white/10 md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t border-stone-200/60 bg-[#fafaf9] px-6 pb-5 pt-3 dark:border-white/[0.06] dark:bg-[#09090b] md:hidden">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-[14px] font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-white/5"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-stone-300/80 bg-white px-4 py-2.5 text-center text-[14px] font-medium text-stone-700 transition-colors hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:text-stone-300"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2.5 text-center text-[14px] font-semibold text-white shadow-md shadow-teal-500/20 transition-all hover:brightness-110"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
