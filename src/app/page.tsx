import { ArrowRight, Sparkles, Palette, Zap, Globe } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center gap-8 pb-20 pt-24 text-center md:pt-32">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Build your portfolio in minutes
        </div>

        <h1 className="max-w-4xl font-display text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          Your work deserves a{" "}
          <span className="text-gradient">stunning portfolio</span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
          Create, customize, and publish beautiful portfolio websites without
          writing a single line of code. Choose from modern templates, customize
          every detail, and go live instantly.
        </p>

        <div className="flex items-center gap-4">
          <Button size="lg" asChild className="gap-2">
            <Link href="/register">
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/portfolio/demo">View Demo</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-24">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Lightning Fast",
              description:
                "Built on Next.js with SSR and edge functions for blazing-fast load times that impress visitors.",
            },
            {
              icon: Palette,
              title: "Fully Customizable",
              description:
                "Every color, font, and layout is adjustable. Make your portfolio truly yours with the live editor.",
            },
            {
              icon: Globe,
              title: "Instant Publishing",
              description:
                "One click to publish. Your portfolio gets a unique URL, SEO optimization, and mobile responsiveness.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
