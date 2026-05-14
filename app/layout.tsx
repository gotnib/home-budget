import type { Metadata, Viewport } from "next";
import { DM_Sans, Lora } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets:  ["latin"],
  variable: "--font-dm-sans",
  axes:     ["opsz"],
});

const lora = Lora({
  subsets:  ["latin"],
  variable: "--font-lora",
  style:    ["normal", "italic"],
});

export const metadata: Metadata = {
  title:       "HoneyCart — Family Budget",
  description: "Cute, minimal budgeting and grocery planning. Know your numbers, fill your cart.",
  authors:     [{ name: "HoneyCart" }],
  keywords:    ["budget", "grocery", "planning", "personal finance"],
  openGraph: {
    title:       "HoneyCart Budget",
    description: "Cute, minimal budgeting and grocery planning.",
    type:        "website",
  },
};

export const viewport: Viewport = {
  themeColor:       "#FDF8F0",
  width:            "device-width",
  initialScale:     1,
  maximumScale:     1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${lora.variable}`}>
        {children}
      </body>
    </html>
  );
}
