"use client";

import {
  Save,
  Check,
  AlertCircle,
  User,
  AtSign,
  FileText,
  Mail,
  Shield,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/auth";
import { apiPatch } from "@/lib/api";
import { APP_URL } from "@/config/constants";
import { cn, getInitials } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const currentTheme = session?.user?.theme ?? "light";
  const [themeValue, setThemeValue] = useState(currentTheme);
  const [themeSwitching, setThemeSwitching] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      username: session?.user?.username ?? "",
      bio: "",
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setSaving(true);
    setMessage(null);
    try {
      await apiPatch("/users/me", data);
      await updateSession({
        name: data.name,
        username: data.username,
      });
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const switchTheme = async (newTheme: string) => {
    if (themeSwitching || newTheme === currentTheme) return;
    setThemeSwitching(true);
    setThemeValue(newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    try {
      await apiPatch("/users/me", { theme: newTheme });
      await updateSession({ theme: newTheme });
    } catch {
      setThemeValue(currentTheme);
      if (currentTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } finally {
      setThemeSwitching(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-[24px] font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Manage your profile, account, and appearance preferences
        </p>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-medium transition-all",
            message.type === "success"
              ? "border border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-400"
              : "border border-red-500/20 bg-red-500/[0.07] text-red-500",
          )}
        >
          {message.type === "success" ? (
            <Check className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Profile Section ────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-border/50 bg-card">
          {/* Section header */}
          <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
              <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Profile</h2>
              <p className="text-[11.5px] text-muted-foreground/70">
                Your public identity across portfolios
              </p>
            </div>
          </div>

          {/* Avatar preview */}
          <div className="flex items-center gap-4 border-b border-border/40 px-6 py-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-500/20 text-[18px] font-bold text-teal-600 ring-2 ring-teal-500/15 dark:text-teal-400">
              {getInitials(session?.user?.name)}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">
                {session?.user?.name ?? "Your Name"}
              </p>
              <p className="text-[12px] text-muted-foreground/60">
                {session?.user?.username
                  ? `@${session.user.username}`
                  : "Set a username below"}
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="divide-y divide-border/40">
            {/* Full Name */}
            <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-start sm:gap-6">
              <label className="flex items-center gap-2 pt-2.5 text-[13px] font-medium text-foreground/80">
                <User className="h-3.5 w-3.5 text-muted-foreground/50" />
                Full Name
              </label>
              <div>
                <Input
                  {...register("name")}
                  placeholder="Your name"
                  className="h-10"
                />
                {errors.name ? (
                  <p className="mt-1.5 text-[11px] font-medium text-red-500">
                    {errors.name.message}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-muted-foreground/50">
                    Displayed on your portfolio and profile
                  </p>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-start sm:gap-6">
              <label className="flex items-center gap-2 pt-2.5 text-[13px] font-medium text-foreground/80">
                <AtSign className="h-3.5 w-3.5 text-muted-foreground/50" />
                Username
              </label>
              <div>
                <div className="flex items-center">
                  <span className="flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted/50 px-3 text-[12px] text-muted-foreground/60">
                    {APP_URL.replace(/^https?:\/\//, "")}/
                  </span>
                  <Input
                    {...register("username")}
                    placeholder="your-username"
                    className="rounded-l-none"
                  />
                </div>
                {errors.username ? (
                  <p className="mt-1.5 text-[11px] font-medium text-red-500">
                    {errors.username.message}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-muted-foreground/50">
                    Your public portfolio URL
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-start sm:gap-6">
              <label className="flex items-center gap-2 pt-2.5 text-[13px] font-medium text-foreground/80">
                <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                Bio
              </label>
              <div>
                <Textarea
                  {...register("bio")}
                  placeholder="A short bio about yourself..."
                  rows={3}
                  className="resize-none"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground/50">
                  Brief description for your profile. Max 500 characters.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Appearance Section ─────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Monitor className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Appearance</h2>
              <p className="text-[11.5px] text-muted-foreground/70">
                Customize the look of your dashboard and studio
              </p>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="grid gap-1.5 sm:grid-cols-[180px_1fr] sm:items-start sm:gap-6">
              <label className="flex items-center gap-2 pt-2 text-[13px] font-medium text-foreground/80">
                Theme
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Light */}
                <button
                  type="button"
                  onClick={() => switchTheme("light")}
                  disabled={themeSwitching}
                  className={cn(
                    "group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200",
                    themeValue === "light"
                      ? "border-teal-500 bg-teal-500/[0.04] shadow-sm"
                      : "border-border/50 bg-transparent hover:border-border hover:bg-accent/30",
                  )}
                >
                  {/* Preview */}
                  <div className="flex h-16 w-full items-end justify-center overflow-hidden rounded-lg border border-border/40 bg-white p-2">
                    <div className="flex w-full gap-1">
                      <div className="h-6 w-8 rounded bg-gray-100" />
                      <div className="flex flex-1 flex-col gap-0.5 rounded bg-gray-50 p-1">
                        <div className="h-1 w-8 rounded-full bg-gray-200" />
                        <div className="h-1 w-5 rounded-full bg-gray-200" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[12px] font-semibold text-foreground">Light</span>
                  </div>
                  {themeValue === "light" && (
                    <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 shadow-sm">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>

                {/* Dark */}
                <button
                  type="button"
                  onClick={() => switchTheme("dark")}
                  disabled={themeSwitching}
                  className={cn(
                    "group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200",
                    themeValue === "dark"
                      ? "border-teal-500 bg-teal-500/[0.04] shadow-sm"
                      : "border-border/50 bg-transparent hover:border-border hover:bg-accent/30",
                  )}
                >
                  {/* Preview */}
                  <div className="flex h-16 w-full items-end justify-center overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-900 p-2">
                    <div className="flex w-full gap-1">
                      <div className="h-6 w-8 rounded bg-zinc-800" />
                      <div className="flex flex-1 flex-col gap-0.5 rounded bg-zinc-800/60 p-1">
                        <div className="h-1 w-8 rounded-full bg-zinc-700" />
                        <div className="h-1 w-5 rounded-full bg-zinc-700" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Moon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[12px] font-semibold text-foreground">Dark</span>
                  </div>
                  {themeValue === "dark" && (
                    <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 shadow-sm">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Account Section ────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
              <Shield className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Account</h2>
              <p className="text-[11.5px] text-muted-foreground/70">
                Your account details and security
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            {/* Email */}
            <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6">
              <label className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/50" />
                Email
              </label>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-foreground/80">
                  {session?.user?.email}
                </p>
                <span className="flex-shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Verified
                </span>
              </div>
            </div>

            {/* Role */}
            <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6">
              <label className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
                <Shield className="h-3.5 w-3.5 text-muted-foreground/50" />
                Role
              </label>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
                  {session?.user?.role ?? "User"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Save bar ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-6 py-4">
          <p className="text-[12px] text-muted-foreground/60">
            {isDirty ? "You have unsaved changes" : "All changes saved"}
          </p>
          <Button
            type="submit"
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-sm shadow-teal-500/15 transition-all hover:shadow-md hover:shadow-teal-500/20 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
