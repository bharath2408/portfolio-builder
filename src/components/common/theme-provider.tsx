"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    const theme = session?.user?.theme ?? "light";

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [session?.user?.theme, status]);

  return <>{children}</>;
}
