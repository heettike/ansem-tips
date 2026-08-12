import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "ansem.tips — tip $ansem",
  description:
    "tip $ansem when you like, reply, follow, or qt. drop 🐂 for a super tip. recipients cash out.",
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
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-black text-white">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
