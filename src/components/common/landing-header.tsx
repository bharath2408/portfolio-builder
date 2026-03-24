"use client";

import { ArrowRight, Moon, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { APP_NAME } from "@/config/constants";

export function LandingHeader() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Check localStorage or system preference on mount
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
    <header className="sticky top-0 z-50 border-b border-stone-200/60 bg-[#fafaf9]/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#09090b]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          {/* Logo — dark bg in light mode, white bg in dark mode */}
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl shadow-md transition-colors dark:bg-white dark:shadow-white/10 bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 dark:from-white dark:via-white dark:to-white shadow-teal-500/25">
            <Sparkles className="h-4 w-4 text-white dark:text-stone-900" />
          </div>
          <span className="font-display text-[17px] font-bold tracking-tight text-stone-900 dark:text-white">
            {APP_NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: "Features", href: "#features" },
            { label: "How it Works", href: "#how-it-works" },
            { label: "Docs", href: "/docs" },
          ].map((item) => (
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
            className="group flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2 text-[13px] font-semibold text-white shadow-md shadow-teal-500/20 transition-all hover:shadow-lg hover:shadow-teal-500/30 hover:brightness-110 active:scale-[0.98]"
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
