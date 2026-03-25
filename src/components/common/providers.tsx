"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/common/theme-provider";
import { Toaster } from "@/components/common/toaster";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
