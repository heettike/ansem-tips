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
  title: "ansem.tips — tip $ansem · The Black Bull",
  description:
    "Tip $ansem when you like, reply, follow, or QT. Drop 🐂 for a super tip. Inspired by Black Bull / @blknoiz06 — tips spread to new wallets.",
  icons: {
    icon: "/brand/ansem.png",
    apple: "/brand/ansem.png",
  },
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
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="site-footer py-6 text-center">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 sm:flex-row sm:justify-between">
              <span>ansem.tips // tip $ansem // the black bull</span>
              <span className="text-muted/70">not financial advice</span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
