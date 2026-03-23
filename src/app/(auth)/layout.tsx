import { Sparkles } from "lucide-react";
import Link from "next/link";

import { APP_NAME } from "@/config/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen">
      {/* Left: Branding panel */}
      <div className="auth-brand-slide hidden w-[45%] flex-col justify-between bg-gradient-to-br from-teal-600 via-cyan-700 to-teal-800 p-10 lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white">{APP_NAME}</span>
        </Link>

        <div className="max-w-md">
          <h1 className="font-display text-[36px] font-bold leading-tight text-white">
            Build portfolios that get you noticed
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            A visual editor that feels like Figma. Drag, drop, customize — publish in seconds. No code required.
          </p>
          <div className="mt-8 flex items-center gap-6">
            <div>
              <p className="text-[24px] font-bold text-white">25+</p>
              <p className="text-[12px] text-white/50">Block types</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[24px] font-bold text-white">5k+</p>
              <p className="text-[12px] text-white/50">Portfolios built</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[24px] font-bold text-white">Free</p>
              <p className="text-[12px] text-white/50">To get started</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-white/30">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>

      {/* Right: Auth form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-[15px] font-bold text-foreground">{APP_NAME}</span>
        </Link>

        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
