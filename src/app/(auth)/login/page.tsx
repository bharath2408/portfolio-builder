"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Github, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) { setError("Invalid email or password"); return; }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    setIsLoading(true);
    await signIn(provider, { callbackUrl });
  };

  return (
    <div className="auth-stagger">
      <div className="mb-8">
        <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-[13px] font-medium text-red-500">
          {error}
        </div>
      )}

      {/* OAuth */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleOAuth("github")}
          disabled={isLoading}
          className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-card text-[13px] font-semibold text-foreground transition-all hover:border-border hover:bg-accent disabled:opacity-50"
        >
          <Github className="h-4 w-4" />
          GitHub
        </button>
        <button
          onClick={() => handleOAuth("google")}
          disabled={isLoading}
          className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-card text-[13px] font-semibold text-foreground transition-all hover:border-border hover:bg-accent disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/50">
            or continue with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-foreground/70">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            className="h-11 rounded-xl"
            {...register("email")}
            disabled={isLoading}
          />
          {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-foreground/70">Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            className="h-11 rounded-xl"
            {...register("password")}
            disabled={isLoading}
          />
          {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-[14px] font-semibold text-white shadow-sm shadow-teal-500/20 transition-all hover:shadow-md hover:shadow-teal-500/25 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400">
          Sign up
        </Link>
      </p>
    </div>
  );
}
