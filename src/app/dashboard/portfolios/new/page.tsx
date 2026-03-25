"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Type,
  Link2,
  FileText,
  Plus,
  Sparkles,
  Layers,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePortfolioMutations } from "@/hooks";
import { apiGet } from "@/lib/api";
import { cn, slugify } from "@/lib/utils";
import {
  createPortfolioSchema,
  type CreatePortfolioInput,
} from "@/lib/validations/portfolio";

export default function NewPortfolioPage() {
  const router = useRouter();
  const { createPortfolio, isPending } = usePortfolioMutations();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "import">("create");
  const [importData, setImportData] = useState<Record<string, unknown> | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string | null; thumbnail: string | null }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Array<{ id: string; name: string; description: string | null; thumbnail: string | null }>>("/templates")
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePortfolioInput>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: { title: "", slug: "", description: "" },
  });

  const title = watch("title");
  const slug = watch("slug");

  const handleTitleChange = (value: string) => {
    setValue("title", value);
    setValue("slug", slugify(value));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    if (file.size > 2 * 1024 * 1024) {
      setImportError("File too large. Maximum 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.title || !json.sections) {
          setImportError("Invalid portfolio JSON. Must have 'title' and 'sections'.");
          return;
        }
        setImportData(json);
        if (json.title) {
          setValue("title", json.title);
          setValue("slug", slugify(json.title));
        }
      } catch {
        setImportError("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const onSubmit = async (data: CreatePortfolioInput) => {
    setError(null);
    try {
      const payload = mode === "import" && importData
        ? { ...data, importData }
        : selectedTemplate
          ? { ...data, templateId: selectedTemplate }
          : data;
      const portfolio = await createPortfolio(payload as CreatePortfolioInput & { importData?: Record<string, unknown>; templateId?: string });
      router.push(`/dashboard/portfolios/${portfolio.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create portfolio");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Back + Header ───────────────────────────────────────── */}
      <div>
        <Link
          href="/dashboard/portfolios"
          className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Portfolios
        </Link>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/15 to-cyan-500/10 ring-1 ring-teal-500/10">
            <Sparkles className="h-5.5 w-5.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="font-display text-[24px] font-bold tracking-tight text-foreground">
              Create Portfolio
            </h1>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
              Set up the basics, then jump into the studio to customize
            </p>
          </div>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-[13px] font-medium text-red-500">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Mode Toggle ──────────────────────────────────────────── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setMode("create"); setImportData(null); setImportError(null); }}
          className={cn("flex-1 rounded-xl border-2 p-3 text-center text-[13px] font-semibold transition-all",
            mode === "create" ? "border-teal-500 bg-teal-500/[0.04] text-foreground" : "border-border/50 text-muted-foreground hover:border-border")}
        >
          Create New
        </button>
        <button
          type="button"
          onClick={() => setMode("import")}
          className={cn("flex-1 rounded-xl border-2 p-3 text-center text-[13px] font-semibold transition-all",
            mode === "import" ? "border-teal-500 bg-teal-500/[0.04] text-foreground" : "border-border/50 text-muted-foreground hover:border-border")}
        >
          Import JSON
        </button>
      </div>

      {/* ── Template Gallery ──────────────────────────────────────── */}
      {mode === "create" && templates.length > 0 && (
        <div>
          <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60">
            Start from a template
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => setSelectedTemplate(null)}
              className={cn("rounded-xl border-2 p-4 text-left transition-all",
                !selectedTemplate ? "border-teal-500 bg-teal-500/[0.04]" : "border-border/50 hover:border-border")}>
              <Plus className="mb-2 h-5 w-5 text-muted-foreground/40" />
              <p className="text-[13px] font-semibold text-foreground">Blank</p>
              <p className="text-[11px] text-muted-foreground/60">Start from scratch</p>
            </button>
            {templates.map((t) => (
              <button key={t.id} type="button" onClick={() => setSelectedTemplate(t.id)}
                className={cn("rounded-xl border-2 p-4 text-left transition-all",
                  selectedTemplate === t.id ? "border-teal-500 bg-teal-500/[0.04]" : "border-border/50 hover:border-border")}>
                <Sparkles className="mb-2 h-5 w-5 text-teal-500" />
                <p className="text-[13px] font-semibold text-foreground">{t.name}</p>
                <p className="text-[11px] text-muted-foreground/60">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Import Upload ─────────────────────────────────────────── */}
      {mode === "import" && !importData && (
        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-border/60 bg-card p-8 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-3 text-[13px] font-medium text-muted-foreground">
            Drop a <code className="rounded bg-muted px-1 py-0.5 text-[12px]">.json</code> file or click to browse
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/50">Exported from Ctrl+E in the studio</p>
          <input type="file" accept=".json" onChange={handleFileUpload} className="absolute inset-0 cursor-pointer opacity-0" />
          {importError && <p className="mt-3 text-[12px] font-medium text-red-500">{importError}</p>}
        </div>
      )}
      {mode === "import" && importData && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
          <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
            Ready to import: {(importData as { title?: string }).title}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {((importData as { sections?: unknown[] }).sections ?? []).length} sections found
          </p>
          <button
            type="button"
            onClick={() => { setImportData(null); setImportError(null); }}
            className="mt-2 text-[11px] text-muted-foreground underline"
          >
            Choose different file
          </button>
        </div>
      )}

      {/* ── Form Card ───────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <section className="overflow-hidden rounded-xl border border-border/50 bg-card">
          {/* Section header */}
          <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Layers className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">
                Portfolio Details
              </h2>
              <p className="text-[11.5px] text-muted-foreground/70">
                Give your portfolio a name and URL
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="divide-y divide-border/40">
            {/* Title */}
            <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[160px_1fr] sm:items-start sm:gap-6">
              <label
                htmlFor="title"
                className="flex items-center gap-2 pt-2.5 text-[13px] font-medium text-foreground/80"
              >
                <Type className="h-3.5 w-3.5 text-muted-foreground/50" />
                Title
              </label>
              <div>
                <Input
                  id="title"
                  placeholder="My Developer Portfolio"
                  {...register("title")}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={cn(errors.title && "border-red-500/50 focus-visible:ring-red-500/30")}
                />
                {errors.title ? (
                  <p className="mt-1.5 text-[11px] font-medium text-red-500">
                    {errors.title.message}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-muted-foreground/50">
                    The name of your portfolio project
                  </p>
                )}
              </div>
            </div>

            {/* Slug */}
            <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[160px_1fr] sm:items-start sm:gap-6">
              <label
                htmlFor="slug"
                className="flex items-center gap-2 pt-2.5 text-[13px] font-medium text-foreground/80"
              >
                <Link2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                URL Slug
              </label>
              <div>
                <div className="flex items-center">
                  <span className="flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted/50 px-3 text-[12px] text-muted-foreground/60">
                    /portfolio/
                  </span>
                  <Input
                    id="slug"
                    className={cn(
                      "rounded-l-none",
                      errors.slug && "border-red-500/50 focus-visible:ring-red-500/30",
                    )}
                    placeholder="my-portfolio"
                    {...register("slug")}
                  />
                </div>
                {errors.slug ? (
                  <p className="mt-1.5 text-[11px] font-medium text-red-500">
                    {errors.slug.message}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-muted-foreground/50">
                    {slug
                      ? `Your portfolio will be at /portfolio/${slug}`
                      : "Auto-generated from title, or set your own"}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[160px_1fr] sm:items-start sm:gap-6">
              <label
                htmlFor="description"
                className="flex items-center gap-2 pt-2.5 text-[13px] font-medium text-foreground/80"
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span>
                  Description
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground/50">
                    (optional)
                  </span>
                </span>
              </label>
              <div>
                <Textarea
                  id="description"
                  placeholder="A brief description of this portfolio..."
                  rows={3}
                  className="resize-none"
                  {...register("description")}
                />
                {errors.description ? (
                  <p className="mt-1.5 text-[11px] font-medium text-red-500">
                    {errors.description.message}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-muted-foreground/50">
                    Used for SEO and portfolio metadata. Max 300 characters.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Live Preview Hint ─────────────────────────────────── */}
        {title && (
          <div className="mt-4 overflow-hidden rounded-xl border border-border/40 bg-accent/20 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
              Preview
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400/20 to-cyan-500/20 text-[11px] font-bold text-teal-600 ring-1 ring-teal-500/15 dark:text-teal-400">
                {title.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground/50">
                  /portfolio/{slug || "..."}
                </p>
              </div>
              <div className="ml-auto rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                draft
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────── */}
        <div className="mt-6 flex items-center justify-between">
          <Button type="button" variant="ghost" asChild className="gap-1.5 text-muted-foreground">
            <Link href="/dashboard/portfolios">
              <ArrowLeft className="h-3.5 w-3.5" />
              Cancel
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-sm shadow-teal-500/15 transition-all hover:shadow-md hover:shadow-teal-500/20 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {isPending ? "Creating..." : "Create & Open Studio"}
          </Button>
        </div>
      </form>
    </div>
  );
}
