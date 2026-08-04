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
      <body className="h-screen max-h-screen bg-[#0B0909] text-[#B5B9F0] antialiased flex flex-col overflow-hidden selection:bg-[#408175] selection:text-[#0B0909]">
        <main className="flex-1 flex flex-col h-full w-full overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
