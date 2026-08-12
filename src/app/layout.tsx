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
    "Tip $ansem on Solana when you like, reply, follow, or QT. Super-tip on 🐂. Inspired by Black Bull / @blknoiz06 culture.",
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
          <footer className="border-t border-card-border py-8 text-center text-xs text-muted">
            ansem.tips · tip $ansem · The Black Bull · not financial advice
          </footer>
        </Providers>
      </body>
    </html>
  );
}
