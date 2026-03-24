import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// Edge-safe auth config — no Prisma, no bcrypt, no Credentials provider.
// Used by middleware. The full config in auth.ts extends this.

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GitHub({ allowDangerousEmailAccountLinking: true,
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({ allowDangerousEmailAccountLinking: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user;
      const pathname = nextUrl.pathname;

      const publicRoutes = ["/", "/login", "/register", "/portfolio", "/docs"];
      const authRoutes = ["/login", "/register"];

      // Redirect authenticated users away from auth pages
      if (isAuthenticated && authRoutes.some((r) => pathname.startsWith(r))) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // Allow public routes
      if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
        return true;
      }

      // Allow API auth and public routes
      if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/public") || pathname.startsWith("/api/templates")) {
        return true;
      }

      // Require auth for everything else
      return isAuthenticated;
    },
  },
};
