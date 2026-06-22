import type { Metadata } from "next";

import { SiteFrame } from "@/components/site-frame";
import "./globals.css";

export const metadata: Metadata = {
  title: "brAIn.md",
  description: "A local markdown vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full overflow-x-hidden overflow-y-auto antialiased"
        suppressHydrationWarning
      >
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
