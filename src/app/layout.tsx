import type { Metadata } from "next";
import { DM_Sans, Outfit, JetBrains_Mono } from "next/font/google";

import { Providers } from "@/components/common/providers";
import { APP_NAME } from "@/config/constants";

import "@/styles/globals.css";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Build Your Portfolio`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Create, customize, and publish stunning portfolio websites without writing code. Modern templates, real-time editing, and instant deployment.",
  keywords: [
    "portfolio builder",
    "website builder",
    "developer portfolio",
    "portfolio templates",
  ],
  authors: [{ name: APP_NAME }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: APP_NAME,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} min-h-screen font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
