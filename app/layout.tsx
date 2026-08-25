import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "Smart Helmet — IoT Accident Detection & Rider Safety",
  description:
    "Low-Cost IoT Smart Helmet for Accident Detection & Rider Safety (PS-06). Real-time collision telemetry, GPS location, and automated emergency SMS alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-[#EDEDED] font-sans">
        {children}
      </body>
    </html>
  );
}
