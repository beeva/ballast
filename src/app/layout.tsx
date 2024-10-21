import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Ballast — deployments and observability that stay boring",
    template: "%s · Ballast",
  },
  description:
    "A deployment and observability control plane: a real build runner, deploy history with rehearsed rollback, metrics and alerting, and a cost estimate that doesn't wait for the invoice.",
  openGraph: {
    title: "Ballast",
    description: "Deployments that stay boring, on-call that stays quiet.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-iron-950 font-sans">{children}</body>
    </html>
  );
}
