import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    ...authConfig.providers,
    Credentials({
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, username: true, theme: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.theme = dbUser.theme;
        }
      }

      if (trigger === "update" && session) {
        token.name = session.name as string | undefined;
        token.username = session.username as string | undefined;
        if (session.theme) token.theme = session.theme as string;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string | null;
        session.user.theme = (token.theme as string) ?? "light";
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.email) {
        const existing = await db.user.findUnique({
          where: { email: user.email },
          select: { username: true },
        });

        if (!existing?.username) {
          const baseUsername = user.email.split("@")[0]?.replace(/[^a-z0-9]/gi, "") ?? "user";
          let username = baseUsername;
          let counter = 1;

          while (await db.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${counter}`;
            counter++;
          }

          await db.user.update({
            where: { email: user.email },
            data: { username },
          });
        }
      }

      return true;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email && user.id) {
        const baseUsername = user.email.split("@")[0]?.replace(/[^a-z0-9]/gi, "") ?? "user";
        let username = baseUsername;
        let counter = 1;

        while (await db.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        await db.user.update({
          where: { id: user.id },
          data: { username },
        });
      }
    },
  },
});
