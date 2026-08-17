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
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-5 py-6">
        <Link href="/" className="brand-text">
          ansem<span className="mark">.tips</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="pill"
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
