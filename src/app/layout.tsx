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
  title: "Flappy Bird - Play Now",
  description: "A modern Flappy Bird game with beautiful graphics, smooth physics, and addictive gameplay. Play on any device!",
  keywords: ["Flappy Bird", "game", "mobile game", "browser game", "HTML5 game"],
  authors: [{ name: "Z.ai" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Flappy Bird",
  },
  openGraph: {
    title: "Flappy Bird - Play Now",
    description: "A modern, beautiful Flappy Bird game you can play on any device.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a1a] text-foreground overflow-hidden`}
      >
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {children}
      </body>
    </html>
  );
}
