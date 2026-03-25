"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import { TemplateCard } from "@/components/community/template-card";
import type { CommunityTemplate } from "@/lib/api/community-templates";

interface CommunityShowcaseProps {
  templates: CommunityTemplate[];
}

export function CommunityShowcase({ templates }: CommunityShowcaseProps) {
  const router = useRouter();

  if (templates.length === 0) return null;

  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
      {/* Section header */}
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/60 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.15em] text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400">
          <Users className="h-3 w-3" />
          Community
        </div>

        <h2 className="font-display text-[32px] font-extrabold tracking-tight text-stone-900 dark:text-white sm:text-[40px]">
          Built by the{" "}
          <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Community
          </span>
        </h2>

        <p className="mt-4 text-[15px] leading-relaxed text-stone-500 dark:text-stone-400">
          Discover portfolios created by real users. One click to clone and make it your own.
        </p>
      </div>

      {/* Template grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            showPreview={false}
            onUse={(id) => router.push(`/community/use/${id}`)}
          />
        ))}
      </div>

      {/* Browse all link */}
      <div className="mt-12 text-center">
        <Link
          href="/community"
          className="group inline-flex items-center gap-2 rounded-2xl border border-stone-300/80 bg-white/80 px-7 py-3.5 text-[14px] font-semibold text-stone-700 shadow-sm backdrop-blur-sm transition-all hover:border-stone-400 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:border-white/20"
        >
          Browse all templates
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
