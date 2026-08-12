import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "WordNest",
    template: "%s | WordNest",
  },
  description: "WordNest — Next-Generation AI Study Suite.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/Wordnest.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WordNest",
  },
  applicationName: "WordNest",
};

export const viewport: Viewport = {
  themeColor: "#0D0D0D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full min-h-dvh w-full max-w-full overflow-x-hidden">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="WordNest" />
        <meta name="application-name" content="WordNest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300..800&family=Righteous&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full min-h-dvh min-w-0 w-full max-w-full bg-[#0D0D0D] text-[#FAFAFA] antialiased flex flex-col overflow-x-hidden selection:bg-[#A58CF4] selection:text-[#0D0D0D]">
        <main className="flex-1 flex flex-col h-full min-h-0 w-full max-w-full overflow-x-hidden min-w-0">
          {children}
        </main>
      </body>
    </html>
  );
}

