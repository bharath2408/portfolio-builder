import {
  ArrowRight,
  Sparkles,
  Layout,
  Search,
  BarChart3,
  Rocket,
  MousePointerClick,
  UserPlus,
  PenTool,
  Share2,
  Layers,
  Zap,
  Shield,
  Clock,
  Code,
  Eye,
  BookOpen,
  ChevronRight,
  Palette,
} from "lucide-react";
import Link from "next/link";

import { LandingHeader } from "@/components/common/landing-header";
import { APP_NAME } from "@/config/constants";
import { db } from "@/lib/db";
import { CommunityShowcase } from "./_components/community-showcase";

export default async function HomePage() {
  const rawTemplates = await db.communityTemplate.findMany({
    take: 8,
    orderBy: { useCount: "desc" },
    include: { user: { select: { username: true, name: true } } },
  });

  const featuredTemplates = rawTemplates.map((t) => ({
    id: t.id,
    portfolioId: t.portfolioId,
    userId: t.userId,
    name: t.name,
    description: t.description,
    category: t.category as "DEVELOPER" | "DESIGNER" | "WRITER" | "OTHER",
    isDark: t.isDark,
    tags: t.tags,
    thumbnail: t.thumbnail,
    useCount: t.useCount,
    createdAt: t.createdAt.toISOString(),
    user: t.user,
  }));
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fafaf9] font-sans dark:bg-[#09090b]">
      {/* ── Ambient background ──────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-teal-400/[0.07] via-cyan-300/[0.04] to-transparent blur-[140px]" />
        <div className="absolute -bottom-60 right-[-10%] h-[700px] w-[700px] rounded-full bg-gradient-to-tl from-violet-500/[0.06] via-blue-400/[0.03] to-transparent blur-[140px]" />
        <div className="absolute left-1/2 top-[40%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-b from-teal-500/[0.04] to-transparent blur-[120px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ── Header ──────────────────────────────────────────────── */}
      <LandingHeader />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 md:pb-32 md:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/60 px-4 py-1.5 text-[12px] font-semibold text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400">
            <Sparkles className="h-3 w-3" />
            Visual portfolio builder for modern creatives
          </div>

          {/* Headline */}
          <h1 className="font-display text-[40px] font-extrabold leading-[1.1] tracking-tight text-stone-900 dark:text-white sm:text-[52px] md:text-[64px] lg:text-[72px]">
            Design Your Portfolio.
            <br />
            <span className="bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
              Ship It in Minutes.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-stone-500 dark:text-stone-400 sm:text-[18px]">
            A Figma-like canvas editor with 25+ drag-and-drop blocks, real-time theme customization, one-click publishing, and built-in analytics.
            No code required.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-teal-500/20 transition-all hover:shadow-2xl hover:shadow-teal-500/30 hover:brightness-110 active:scale-[0.98]"
            >
              Start Building — Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/docs"
              className="group inline-flex items-center gap-2 rounded-2xl border border-stone-300/80 bg-white/80 px-7 py-4 text-[15px] font-semibold text-stone-700 shadow-sm backdrop-blur-sm transition-all hover:border-stone-400 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:border-white/20"
            >
              <BookOpen className="h-4 w-4 text-stone-400" />
              Read the Docs
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-[12px] font-medium text-stone-400 dark:text-stone-500">
            Free forever &middot; No credit card &middot; Publish in under 5 minutes
          </p>
        </div>

        {/* ── Hero Visual — Studio Preview ────────────────────── */}
        <div className="mx-auto mt-16 max-w-5xl md:mt-20">
          <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-1.5 shadow-2xl shadow-stone-900/[0.08] dark:border-stone-700 dark:bg-stone-800 dark:shadow-black/40">
            {/* Light mode = dark editor, Dark mode = white editor */}
            <div className="rounded-xl bg-gradient-to-br from-[#111118] to-[#0c0c12] p-6 dark:from-white dark:to-stone-50 md:p-8">
              {/* Window chrome */}
              <div className="mb-6 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                <div className="ml-4 flex items-center gap-2 rounded-md bg-white/5 px-3 py-1 dark:bg-stone-900/[0.06]">
                  <div className="h-2 w-2 rounded-full bg-teal-400/50" />
                  <span className="text-[10px] text-white/30 dark:text-stone-400">{APP_NAME} Studio</span>
                </div>
              </div>

              {/* Editor mockup — uses css vars for element colors */}
              <div className="grid grid-cols-12 gap-3">
                {/* Left panel */}
                <div className="col-span-2 hidden space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 dark:border-stone-200/60 dark:bg-stone-100/50 md:block">
                  <div className="h-3 w-16 rounded bg-white/10 dark:bg-stone-300" />
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 rounded bg-teal-500/15 px-1.5 py-1 dark:bg-teal-500/10">
                      <div className="h-2 w-2 rounded bg-teal-400/40 dark:bg-teal-500/50" />
                      <div className="h-2 w-10 rounded bg-teal-400/30 dark:bg-teal-500/30" />
                    </div>
                    <div className="flex items-center gap-1.5 px-1.5 py-1">
                      <div className="h-2 w-2 rounded bg-white/10 dark:bg-stone-300" />
                      <div className="h-2 w-8 rounded bg-white/5 dark:bg-stone-200" />
                    </div>
                    <div className="flex items-center gap-1.5 px-1.5 py-1">
                      <div className="h-2 w-2 rounded bg-white/10 dark:bg-stone-300" />
                      <div className="h-2 w-12 rounded bg-white/5 dark:bg-stone-200" />
                    </div>
                    <div className="flex items-center gap-1.5 px-1.5 py-1">
                      <div className="h-2 w-2 rounded bg-white/10 dark:bg-stone-300" />
                      <div className="h-2 w-6 rounded bg-white/5 dark:bg-stone-200" />
                    </div>
                  </div>
                </div>

                {/* Canvas */}
                <div className="col-span-12 rounded-lg border border-white/[0.06] bg-white/[0.015] p-5 dark:border-stone-200/60 dark:bg-stone-50/50 md:col-span-8">
                  <div className="space-y-4">
                    <div className="h-8 w-3/4 rounded-lg bg-gradient-to-r from-teal-500/25 to-cyan-400/15 dark:from-teal-500/20 dark:to-cyan-400/10" />
                    <div className="h-3 w-full rounded bg-white/[0.06] dark:bg-stone-200" />
                    <div className="h-3 w-5/6 rounded bg-white/[0.04] dark:bg-stone-200/70" />
                    <div className="mt-5 flex gap-3">
                      <div className="h-9 w-28 rounded-lg bg-gradient-to-r from-teal-500/40 to-cyan-500/30" />
                      <div className="h-9 w-24 rounded-lg border border-white/10 bg-white/[0.03] dark:border-stone-300 dark:bg-stone-100" />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2.5">
                      <div className="h-24 rounded-lg border border-white/[0.06] bg-white/[0.02] dark:border-stone-200 dark:bg-stone-100/50" />
                      <div className="h-24 rounded-lg border border-teal-500/30 bg-teal-500/[0.04] ring-1 ring-teal-400/20" />
                      <div className="h-24 rounded-lg border border-white/[0.06] bg-white/[0.02] dark:border-stone-200 dark:bg-stone-100/50" />
                    </div>
                  </div>
                </div>

                {/* Right panel */}
                <div className="col-span-2 hidden space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 dark:border-stone-200/60 dark:bg-stone-100/50 md:block">
                  <div className="h-3 w-14 rounded bg-white/10 dark:bg-stone-300" />
                  <div className="mt-3 space-y-2">
                    <div className="h-5 w-full rounded bg-white/[0.06] dark:bg-stone-200" />
                    <div className="h-5 w-full rounded bg-white/[0.06] dark:bg-stone-200" />
                    <div className="mt-2 h-3 w-12 rounded bg-white/10 dark:bg-stone-300" />
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-5 rounded bg-white/[0.06] dark:bg-stone-200" />
                      <div className="h-5 rounded bg-white/[0.06] dark:bg-stone-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
            Features
          </p>
          <h2 className="font-display text-[32px] font-extrabold tracking-tight text-stone-900 dark:text-white sm:text-[40px]">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
              stand out
            </span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-500 dark:text-stone-400">
            Professional portfolio websites, built visually.
            No design skills or coding knowledge required.
          </p>
        </div>

        {/* Feature bento grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: PenTool,
              title: "Visual Studio Editor",
              description: "A Figma-like canvas with drag-and-drop blocks, resizing handles, smart guides, and real-time preview. Design exactly what you envision.",
              gradient: "from-teal-500 to-cyan-500",
              bg: "from-teal-500/[0.05] to-cyan-500/[0.02]",
            },
            {
              icon: Layers,
              title: "25+ Block Types",
              description: "Headings, images, skill bars, project cards, testimonials, contact forms, and more. Everything you need to tell your story.",
              gradient: "from-violet-500 to-purple-500",
              bg: "from-violet-500/[0.05] to-purple-500/[0.02]",
            },
            {
              icon: Palette,
              title: "Full Theme Control",
              description: "Customize every color, font, shadow, and border radius. Reference theme tokens in blocks for consistent, one-click theme changes.",
              gradient: "from-amber-500 to-orange-500",
              bg: "from-amber-500/[0.05] to-orange-500/[0.02]",
            },
            {
              icon: Search,
              title: "SEO & Open Graph",
              description: "Set meta titles, descriptions, and OG images. Your portfolio is built to rank in Google and look stunning when shared on social media.",
              gradient: "from-emerald-500 to-green-500",
              bg: "from-emerald-500/[0.05] to-green-500/[0.02]",
            },
            {
              icon: BarChart3,
              title: "Built-in Analytics",
              description: "Track views, referrers, and device breakdowns with charts. Understand how visitors discover and interact with your portfolio.",
              gradient: "from-blue-500 to-indigo-500",
              bg: "from-blue-500/[0.05] to-indigo-500/[0.02]",
            },
            {
              icon: Rocket,
              title: "One-Click Publish",
              description: "Hit publish and your portfolio is live instantly. Auto-versioning lets you preview and restore any previous state.",
              gradient: "from-rose-500 to-pink-500",
              bg: "from-rose-500/[0.05] to-pink-500/[0.02]",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`group relative overflow-hidden rounded-2xl border border-stone-200/70 bg-gradient-to-br ${feature.bg} p-7 transition-all duration-300 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-white/[0.06] dark:hover:border-white/[0.12] dark:hover:shadow-none`}
            >
              <div
                className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 shadow-lg`}
                style={{ boxShadow: `0 8px 24px rgba(0,0,0,0.12)` }}
              >
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 text-[16px] font-bold text-stone-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Extra features strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12px] font-medium text-stone-400 dark:text-stone-500">
          {[
            { icon: Zap, label: "Command Palette (Ctrl+K)" },
            { icon: Clock, label: "Version History" },
            { icon: Shield, label: "Password Protection" },
            { icon: Code, label: "Custom CSS Support" },
            { icon: Eye, label: "Responsive Preview" },
            { icon: Layout, label: "Multiple Layouts" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <item.icon className="h-3 w-3 text-teal-500/50" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Community Showcase ──────────────────────────────────── */}
      <CommunityShowcase templates={featuredTemplates} />

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="border-y border-stone-200/60 bg-stone-100/50 dark:border-white/[0.04] dark:bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
              How it works
            </p>
            <h2 className="font-display text-[32px] font-extrabold tracking-tight text-stone-900 dark:text-white sm:text-[40px]">
              Three steps to a{" "}
              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                published portfolio
              </span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {[
              {
                step: "01",
                icon: UserPlus,
                title: "Create Your Account",
                description: "Sign up with email, GitHub, or Google. Takes 30 seconds. No credit card required.",
                color: "teal",
              },
              {
                step: "02",
                icon: MousePointerClick,
                title: "Design in the Studio",
                description: "Choose a template or start blank. Add blocks, customize themes, and arrange your content on a visual canvas.",
                color: "cyan",
              },
              {
                step: "03",
                icon: Share2,
                title: "Publish & Share",
                description: "One click to go live. Get a unique URL, optimize for SEO, and track visitors with built-in analytics.",
                color: "teal",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-stone-200/70 bg-white p-8 transition-all hover:border-stone-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12]"
              >
                {/* Step number */}
                <span className="absolute right-6 top-6 font-display text-[48px] font-black text-stone-100 dark:text-white/[0.04]">
                  {item.step}
                </span>
                <div className="relative">
                  <div className="mb-5 inline-flex rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 p-3 shadow-lg shadow-teal-500/20">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-[18px] font-bold text-stone-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="relative overflow-hidden rounded-3xl border border-stone-200/60 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-10 text-center shadow-2xl dark:border-white/[0.06] dark:from-[#111118] dark:via-[#0f0f16] dark:to-[#111118] md:p-16">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-teal-500/20 to-transparent blur-[80px]" />

          <div className="relative">
            <h2 className="font-display text-[28px] font-extrabold tracking-tight text-white sm:text-[36px] md:text-[44px]">
              Ready to build your portfolio?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-stone-400">
              Join creators and developers using {APP_NAME} to showcase their work.
              Free to start, publish in minutes.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-teal-500/30 transition-all hover:shadow-2xl hover:shadow-teal-500/40 hover:brightness-110 active:scale-[0.98]"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs"
                className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-[15px] font-semibold text-white/80 transition-all hover:border-white/20 hover:bg-white/10"
              >
                View Documentation
                <ChevronRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200/60 dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 shadow-sm shadow-teal-500/20 dark:from-white dark:via-white dark:to-white dark:shadow-white/10">
                <Sparkles className="h-3.5 w-3.5 text-white dark:text-stone-900" />
              </div>
              <span className="font-display text-[14px] font-bold text-stone-800 dark:text-stone-200">
                {APP_NAME}
              </span>
            </div>

            <nav className="flex items-center gap-6 text-[12px] font-medium text-stone-400 dark:text-stone-500">
              <Link href="/docs" className="transition-colors hover:text-stone-700 dark:hover:text-stone-300">
                Documentation
              </Link>
              <Link href="/login" className="transition-colors hover:text-stone-700 dark:hover:text-stone-300">
                Sign In
              </Link>
              <Link href="/register" className="transition-colors hover:text-stone-700 dark:hover:text-stone-300">
                Get Started
              </Link>
            </nav>

            <p className="text-[11px] text-stone-400 dark:text-stone-600">
              &copy; {new Date().getFullYear()} {APP_NAME}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
