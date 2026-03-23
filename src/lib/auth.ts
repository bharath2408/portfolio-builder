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
          select: { id: true, role: true, username: true, theme: true, image: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.theme = dbUser.theme;
          token.userImage = dbUser.image;
        }
      }

      if (trigger === "update" && session) {
        token.name = session.name as string | undefined;
        token.username = session.username as string | undefined;
        if (session.theme) token.theme = session.theme as string;
        if (session.image !== undefined) token.userImage = session.image as string;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string | null;
        session.user.theme = (token.theme as string) ?? "light";
        session.user.image = (token.userImage as string) || (token.picture as string) || null;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account && account.provider !== "credentials" && user.email) {
        const existing = await db.user.findUnique({
          where: { email: user.email },
          select: { id: true, username: true },
        });

        if (existing) {
          // Link this OAuth account to the existing user if not already linked
          const linkedAccount = await db.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!linkedAccount) {
            await db.account.create({
              data: {
                userId: existing.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | undefined,
              },
            });
          }

          // Set username if missing
          if (!existing.username) {
            const baseUsername = user.email.split("@")[0]?.replace(/[^a-z0-9]/gi, "") ?? "user";
            let username = baseUsername;
            let counter = 1;

            while (await db.user.findUnique({ where: { username } })) {
              username = `${baseUsername}${counter}`;
              counter++;
            }

            await db.user.update({
              where: { id: existing.id },
              data: { username },
            });
          }
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
