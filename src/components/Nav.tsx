"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/onboard", label: "tip" },
  { href: "/dashboard", label: "dash" },
  { href: "/withdraw", label: "withdraw" },
];

export function Nav() {
  const pathname = usePathname();

  // landing is a poster field — no sticky product chrome
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="relative z-40">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-6 px-6 py-6">
        <Link href="/" className="text-sm font-bold tracking-tight">
          ansem.tips
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="link-quiet"
                data-active={active ? "true" : "false"}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
