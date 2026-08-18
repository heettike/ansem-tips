import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

/* body / nav / captions — quiet grotesque */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/* editorial serif display — the spec's waldenburg substitute.
   eb garamond ships 400-800 only; 400 is its lightest cut and stands in
   for the spec's 300. display copy is never bolded. */
const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ansem.tips — tip $ansem",
  description:
    "tip $ansem when you like. drop 🐂 in a reply or qt for a super tip. recipients cash out.",
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
    <html lang="en" className={`${inter.variable} ${garamond.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
