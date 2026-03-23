"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { Toaster } from "@/components/common/toaster";
import { ThemeProvider } from "@/components/common/theme-provider";

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
