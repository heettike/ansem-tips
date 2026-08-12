import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
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
  title: "ansem.tips — tip $ansem on every like",
  description:
    "Twitter/X tipping with $ansem on Solana. Like, comment, follow, QT — auto-tip. Super-tip on 🐂.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-card-border py-8 text-center text-xs text-muted">
            ansem.tips · v0 single tipper · DEMO_MODE friendly · not financial advice
          </footer>
        </Providers>
      </body>
    </html>
  );
}
