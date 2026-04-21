import type { Metadata } from "next";
import { Cairo, Marhey } from "next/font/google";

import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/constants";

import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const marhey = Marhey({
  subsets: ["arabic", "latin"],
  variable: "--font-marhey",
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} | ${BRAND_SUBTITLE}`,
  description: "نظام إدارة حجوزات وتصميم فواتير لجلسات التصوير باستضافة Next.js وSupabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${marhey.variable}`}>
      <body>{children}</body>
    </html>
  );
}
