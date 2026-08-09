import React from "react";
import "./globals.css";

export const metadata = {
  title: "WordNest | Sign In & Account Portal",
  description: "Secure authentication portal for WordNest — Next-Generation AI Study Suite.",
  icons: {
    icon: "/Wordnest.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-screen overflow-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300..800&family=Righteous&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-screen max-h-screen bg-[#0D0D0D] text-[#FAFAFA] antialiased flex flex-col overflow-hidden selection:bg-[#A58CF4] selection:text-[#0D0D0D]">
        <main className="flex-1 flex flex-col h-full w-full overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
