import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HoneyCart Budget",
    template: "%s | HoneyCart Budget",
  },
  description:
    "Cute, minimal budgeting and grocery planning. Know your numbers, fill your cart.",
  keywords: ["budget", "grocery", "planning", "personal finance"],
  authors: [{ name: "HoneyCart" }],
  openGraph: {
    title: "HoneyCart Budget",
    description: "Cute, minimal budgeting and grocery planning.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HoneyCart",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FDF8F0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-cream antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
