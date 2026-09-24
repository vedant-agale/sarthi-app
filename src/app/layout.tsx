import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SARTHI — Autonomous Assistant",
  description: "Personal Routine & Accountability Engine",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SARTHI",
  },
};

// 🟢 iPhone Zoom Disable + Proper Mobile Fit
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-black overflow-x-hidden">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white selection:bg-amber-500 selection:text-black overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}