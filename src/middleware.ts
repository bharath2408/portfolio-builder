import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

// Use the edge-safe config (no Prisma, no bcrypt)
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
