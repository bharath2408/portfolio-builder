import { Palette } from "lucide-react";
import Link from "next/link";

import { APP_NAME } from "@/config/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Palette className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">{APP_NAME}</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
