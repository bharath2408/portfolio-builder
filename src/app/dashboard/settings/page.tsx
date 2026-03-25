"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  Globe,
  Copy as CopyIcon,
  Lock,
  Trash2,
  Download,
  Bell,
  Eye,
  EyeOff,
  Loader2,
  Layout,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";

import { ImageUpload } from "@/components/common/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { APP_URL } from "@/config/constants";
import { apiPatch, apiPost, apiGet, apiDelete } from "@/lib/api";
import { cn, getInitials } from "@/lib/utils";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@/lib/validations/auth";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  role: string;
  theme: string;
  emailNotifications: boolean;
  hasPassword: boolean;
  portfolios: { id: string; title: string; isDefault: boolean }[];
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileImage, setProfileImage] = useState("");

  const currentTheme = session?.user?.theme ?? "light";
  const [themeValue, setThemeValue] = useState(currentTheme);
  const [themeSwitching, setThemeSwitching] = useState(false);

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [togglingNotifications, setTogglingNotifications] = useState(false);

  // Default portfolio state
  const [defaultPortfolioId, setDefaultPortfolioId] = useState<string>("");
  const [settingDefault, setSettingDefault] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Fetch full profile
  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiGet<UserProfile>("/users/me");
      setProfile(data);
      setProfileImage(data.image ?? "");
      setEmailNotifications(data.emailNotifications);
      const defaultP = data.portfolios.find((p) => p.isDefault);
      setDefaultPortfolioId(defaultP?.id ?? "");
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    formState: { errors: pwErrors },
    reset: resetPw,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setSaving(true);
    setMessage(null);
    try {
      await apiPatch("/users/me", { ...data, image: profileImage });
      await updateSession({
        name: data.name,
        username: data.username,
        image: profileImage,
      });
      window.dispatchEvent(new Event("session-updated"));
      showMsg("success", "Profile updated successfully.");
    } catch {
      showMsg("error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (data: ChangePasswordInput) => {
    setChangingPassword(true);
    try {
      await apiPost("/users/me/password", data);
      showMsg("success", "Password changed successfully.");
      setShowPasswordForm(false);
      resetPw();
    } catch {
      showMsg("error", "Failed to change password. Check your current password.");
    } finally {
      setChangingPassword(false);
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

  const toggleNotifications = async () => {
    setTogglingNotifications(true);
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    try {
      await apiPatch("/users/me", { emailNotifications: newValue });
      showMsg("success", `Email notifications ${newValue ? "enabled" : "disabled"}.`);
    } catch {
      setEmailNotifications(!newValue);
      showMsg("error", "Failed to update notification settings.");
    } finally {
      setTogglingNotifications(false);
    }
  };

  const changeDefaultPortfolio = async (portfolioId: string) => {
    setSettingDefault(true);
    const prev = defaultPortfolioId;
    setDefaultPortfolioId(portfolioId);
    try {
      await apiPatch("/users/me", { defaultPortfolioId: portfolioId });
      showMsg("success", "Default portfolio updated.");
      fetchProfile();
    } catch {
      setDefaultPortfolioId(prev);
      showMsg("error", "Failed to set default portfolio.");
    } finally {
      setSettingDefault(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/users/me/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foliocraft-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMsg("success", "Data exported successfully.");
    } catch {
      showMsg("error", "Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await apiDelete("/users/me");
      signOut({ callbackUrl: "/" });
    } catch {
      showMsg("error", "Failed to delete account.");
      setDeleting(false);
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

          {/* Avatar / Profile Picture Upload */}
          <div className="flex items-center gap-4 border-b border-border/40 px-6 py-5">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-teal-500/15"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-500/20 text-[18px] font-bold text-teal-600 ring-2 ring-teal-500/15 dark:text-teal-400">
                  {getInitials(session?.user?.name)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-foreground">
                {session?.user?.name ?? "Your Name"}
              </p>
              <p className="mb-2 text-[12px] text-muted-foreground/60">
                {session?.user?.username
                  ? `@${session.user.username}`
                  : "Set a username below"}
              </p>
              <div className="max-w-[220px]">
                <ImageUpload
                  value={profileImage}
                  onChange={setProfileImage}
                  compact
                />
              </div>
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

            {/* Subdomain URL */}
            {session?.user?.username && process.env.NEXT_PUBLIC_ROOT_DOMAIN && (
              <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6">
                <label className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground/50" />
                  Your Site
                </label>
                <div className="flex items-center gap-2">
                  <code className="rounded-md bg-muted px-2.5 py-1 text-[12px] font-medium text-foreground/80">
                    {session.user.username}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`https://${session.user.username}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
                    title="Copy URL"
                  >
                    <CopyIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Change Password */}
            <div className="px-6 py-5">
              <div className="grid gap-1.5 sm:grid-cols-[180px_1fr] sm:items-start sm:gap-6">
                <label className="flex items-center gap-2 pt-2.5 text-[13px] font-medium text-foreground/80">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                  Password
                </label>
                <div>
                  {!showPasswordForm ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordForm(true)}
                      disabled={profile !== null && !profile.hasPassword}
                      className="text-[12px]"
                    >
                      <Lock className="mr-1.5 h-3.5 w-3.5" />
                      Change Password
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          {...registerPw("currentPassword")}
                          type={showCurrentPw ? "text" : "password"}
                          placeholder="Current password"
                          className="h-9 pr-9 text-[13px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
                        >
                          {showCurrentPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {pwErrors.currentPassword && (
                        <p className="text-[11px] font-medium text-red-500">
                          {pwErrors.currentPassword.message}
                        </p>
                      )}
                      <div className="relative">
                        <Input
                          {...registerPw("newPassword")}
                          type={showNewPw ? "text" : "password"}
                          placeholder="New password"
                          className="h-9 pr-9 text-[13px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
                        >
                          {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {pwErrors.newPassword && (
                        <p className="text-[11px] font-medium text-red-500">
                          {pwErrors.newPassword.message}
                        </p>
                      )}
                      <Input
                        {...registerPw("confirmPassword")}
                        type="password"
                        placeholder="Confirm new password"
                        className="h-9 text-[13px]"
                      />
                      {pwErrors.confirmPassword && (
                        <p className="text-[11px] font-medium text-red-500">
                          {pwErrors.confirmPassword.message}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={changingPassword}
                          onClick={handleSubmitPw(onChangePassword)}
                          className="gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-[12px] text-white"
                        >
                          {changingPassword ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                          {changingPassword ? "Updating..." : "Update Password"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPasswordForm(false);
                            resetPw();
                          }}
                          className="text-[12px]"
                        >
                          Cancel
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50">
                        Must be 8+ characters with uppercase, lowercase, and a number.
                      </p>
                    </div>
                  )}
                  {profile !== null && !profile.hasPassword && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground/50">
                      Your account uses social login. Use forgot password to set one.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Preferences Section ─────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Preferences</h2>
              <p className="text-[11.5px] text-muted-foreground/70">
                Notifications and default settings
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            {/* Email Notifications Toggle */}
            <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6">
              <label className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/50" />
                Email Notifications
              </label>
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground/60">
                  Receive updates about views, submissions, and tips
                </p>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  disabled={togglingNotifications}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    emailNotifications ? "bg-teal-500" : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
                      emailNotifications ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Default Portfolio */}
            {profile && profile.portfolios.length > 0 && (
              <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-start sm:gap-6">
                <label className="flex items-center gap-2 pt-2.5 text-[13px] font-medium text-foreground/80">
                  <Layout className="h-3.5 w-3.5 text-muted-foreground/50" />
                  Default Portfolio
                </label>
                <div>
                  <select
                    value={defaultPortfolioId}
                    onChange={(e) => changeDefaultPortfolio(e.target.value)}
                    disabled={settingDefault}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground shadow-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                  >
                    <option value="">None</option>
                    {profile.portfolios.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-muted-foreground/50">
                    This portfolio will be shown at your profile URL
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Save bar ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-6 py-4">
          <p className="text-[12px] text-muted-foreground/60">
            {isDirty || profileImage !== (profile?.image ?? "")
              ? "You have unsaved changes"
              : "All changes saved"}
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

      {/* ── Data Section ────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Data</h2>
            <p className="text-[11.5px] text-muted-foreground/70">
              Export or manage your data
            </p>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-1.5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6">
            <label className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
              <Download className="h-3.5 w-3.5 text-muted-foreground/50" />
              Export All Data
            </label>
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground/60">
                Download all your data as a JSON file
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportData}
                disabled={exporting}
                className="gap-1.5 text-[12px]"
              >
                {exporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {exporting ? "Exporting..." : "Export JSON"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Danger Zone ─────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-red-500/30 bg-card">
        <div className="flex items-center gap-3 border-b border-red-500/20 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            <Trash2 className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-red-600 dark:text-red-400">
              Danger Zone
            </h2>
            <p className="text-[11.5px] text-muted-foreground/70">
              Irreversible actions — proceed with caution
            </p>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-[180px_1fr] sm:items-start sm:gap-6">
            <label className="flex items-center gap-2 pt-1 text-[13px] font-medium text-foreground/80">
              <Trash2 className="h-3.5 w-3.5 text-red-500/60" />
              Delete Account
            </label>
            <div>
              <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground/60">
                Permanently delete your account and all associated data including
                portfolios, sections, blocks, and themes. This action cannot be
                undone.
              </p>
              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-1.5 border-red-500/30 text-[12px] text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete My Account
                </Button>
              ) : (
                <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/[0.03] p-4">
                  <p className="text-[12px] font-medium text-red-600 dark:text-red-400">
                    Type <span className="font-bold">delete my account</span> to
                    confirm:
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="delete my account"
                    className="h-9 border-red-500/30 text-[13px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        deleteConfirmText !== "delete my account" || deleting
                      }
                      onClick={deleteAccount}
                      className="gap-1.5 bg-red-600 text-[12px] text-white hover:bg-red-700"
                    >
                      {deleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      {deleting ? "Deleting..." : "Permanently Delete"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                      }}
                      className="text-[12px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
