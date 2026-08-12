"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  // landing stays a poster — no chrome
  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="px-6 py-10 text-center text-xs text-muted">
      ansem.tips · tip $ansem · the black bull · not financial advice
    </footer>
  );
}
