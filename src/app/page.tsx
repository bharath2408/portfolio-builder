import {
  ArrowRight,
  Sparkles,
  Palette,
  Zap,
  Globe,
  Layout,
  Search,
  BarChart3,
  Rocket,
  MousePointerClick,
  UserPlus,
  PenTool,
  Share2,
} from "lucide-react";
import Link from "next/link";

import { APP_NAME } from "@/config/constants";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-sans dark:bg-[#0a0a0f]">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 -top-20 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-teal-400/10 via-cyan-400/5 to-transparent blur-[120px]" />
        <div className="absolute -bottom-40 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-purple-500/10 via-cyan-500/5 to-transparent blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-gradient-to-b from-teal-500/5 to-transparent blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0a0a0f]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md shadow-teal-500/20">
              <Palette className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              {APP_NAME}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-teal-500/25 transition-all hover:shadow-lg hover:shadow-teal-500/30 hover:brightness-110"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 text-center md:pt-32">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/50 px-4 py-1.5 text-sm font-medium text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400">
          <Sparkles className="h-3.5 w-3.5" />
          The portfolio builder for modern creatives
        </div>

        <h1 className="mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-6xl lg:text-7xl">
          Build Your Portfolio{" "}
          <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-400 bg-clip-text text-transparent">
            in Minutes
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400 md:text-xl">
          A Figma-like visual editor to design, customize, and publish stunning
          portfolio websites. Drag blocks, tweak themes, and go live with one click.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-110"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20"
          >
            Sign In
          </Link>
        </div>

        {/* Hero visual placeholder */}
        <div className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-b from-gray-50 to-white p-1 shadow-2xl shadow-gray-900/5 dark:border-white/[0.08] dark:from-white/[0.03] dark:to-white/[0.01]">
          <div className="rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 dark:from-[#111118] dark:to-[#0d0d14]">
            <div className="flex items-center gap-2 pb-6">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs font-medium text-gray-500">
                {APP_NAME} Studio
              </span>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2 space-y-3">
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="h-4 w-3/4 rounded bg-white/5" />
                <div className="h-4 w-5/6 rounded bg-white/5" />
                <div className="h-4 w-2/3 rounded bg-white/5" />
              </div>
              <div className="col-span-8 space-y-4 rounded-lg border border-white/5 bg-white/[0.02] p-6">
                <div className="h-6 w-2/3 rounded bg-gradient-to-r from-teal-500/30 to-cyan-500/20" />
                <div className="h-3 w-full rounded bg-white/5" />
                <div className="h-3 w-5/6 rounded bg-white/5" />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="h-20 rounded-lg bg-white/5" />
                  <div className="h-20 rounded-lg bg-white/5" />
                  <div className="h-20 rounded-lg bg-white/5" />
                </div>
              </div>
              <div className="col-span-2 space-y-3">
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="h-4 w-2/3 rounded bg-white/5" />
                <div className="h-20 rounded-lg bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-14 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
              stand out
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-600 dark:text-gray-400">
            From visual editing to SEO optimization, Foliocraft gives you all the tools to create a portfolio that impresses.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: PenTool,
              title: "Visual Editor",
              description:
                "A Figma-like canvas with drag-and-drop blocks, resizing handles, and real-time preview. Design exactly what you envision.",
              gradient: "from-teal-500 to-cyan-500",
            },
            {
              icon: Layout,
              title: "25+ Block Types",
              description:
                "Headings, text, images, skill bars, project cards, stats, contact forms, and more. Mix and match to tell your story.",
              gradient: "from-violet-500 to-purple-500",
            },
            {
              icon: Palette,
              title: "Dark & Light Themes",
              description:
                "Customize every color, font, and border radius. Choose from curated presets or create your own unique look.",
              gradient: "from-amber-500 to-orange-500",
            },
            {
              icon: Search,
              title: "SEO Optimized",
              description:
                "Meta titles, descriptions, Open Graph images, and Twitter cards. Your portfolio is built to be discovered.",
              gradient: "from-emerald-500 to-green-500",
            },
            {
              icon: BarChart3,
              title: "Analytics Ready",
              description:
                "Track views and engagement. Understand how visitors interact with your portfolio and optimize for impact.",
              gradient: "from-blue-500 to-indigo-500",
            },
            {
              icon: Rocket,
              title: "One-Click Publish",
              description:
                "Hit publish and your portfolio is live instantly with a custom URL. Update anytime — changes go live immediately.",
              gradient: "from-rose-500 to-pink-500",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-gray-200/80 bg-white/60 p-6 backdrop-blur-sm transition-all hover:border-gray-300/80 hover:shadow-lg hover:shadow-gray-900/5 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12] dark:hover:shadow-none"
            >
              <div
                className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 shadow-md`}
                style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}
              >
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-gray-200/60 bg-gray-50/50 dark:border-white/[0.04] dark:bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-600 dark:text-gray-400">
              Three simple steps to go from zero to a published portfolio.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: UserPlus,
                title: "Create Account",
                description:
                  "Sign up in seconds. No credit card required. Your creative journey starts here.",
              },
              {
                step: "02",
                icon: MousePointerClick,
                title: "Design in Studio",
                description:
                  "Use the drag-and-drop editor to add blocks, customize your theme, and arrange your content.",
              },
              {
                step: "03",
                icon: Share2,
                title: "Publish & Share",
                description:
                  "One click to go live. Share your unique portfolio URL with the world and start getting noticed.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step {item.step}
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200/80 bg-gradient-to-br from-white via-teal-50/30 to-white p-12 shadow-xl shadow-gray-900/5 dark:border-white/[0.06] dark:from-white/[0.03] dark:via-teal-500/[0.03] dark:to-white/[0.01]">
          <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            Ready to build your portfolio?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-gray-600 dark:text-gray-400">
            Join creators and developers who use {APP_NAME} to showcase their
            work. Free to start, no credit card needed.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-110"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 dark:border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-sm text-gray-500 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-teal-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {APP_NAME}
            </span>
          </div>
          <p>
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="transition-colors hover:text-gray-900 dark:hover:text-white"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="transition-colors hover:text-gray-900 dark:hover:text-white"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
