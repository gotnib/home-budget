import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HoneyCart — Family Budget",
  description: "Cute, minimal budgeting and grocery planning. Know your numbers, fill your cart.",
  authors: [{ name: "HoneyCart" }],
  keywords: ["budget", "grocery", "planning", "personal finance"],
  openGraph: {
    title: "HoneyCart Budget",
    description: "Cute, minimal budgeting and grocery planning.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "HoneyCart",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FDF8F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
