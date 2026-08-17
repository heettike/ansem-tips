"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "dash" },
  { href: "/withdraw", label: "withdraw" },
];

export function Nav() {
  const pathname = usePathname();

  // the landing carries its own masthead — no product chrome
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="relative z-40 bg-[#f5f5f5]">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-5">
        <Link href="/" className="brand-text">
          ansem<span className="mark">.tips</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-6">
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
          <Link
            href="/onboard"
            className="btn-primary"
            data-active={pathname.startsWith("/onboard") ? "true" : "false"}
          >
            tip
          </Link>
        </nav>
      </div>
    </header>
  );
}
