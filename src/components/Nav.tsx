"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/onboard", label: "Tipper" },
  { href: "/dashboard", label: "Dash" },
  { href: "/withdraw", label: "Cash out" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-nav sticky top-0 z-40 bg-background/90">
      <div className="site-nav-strip px-4 py-1.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span className="pulse-dot" />
            <span>ansem.tips // live</span>
          </span>
          <span className="hidden text-accent/80 sm:inline">
            tip $ansem · the black bull
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="nav-mark relative">
            <Image
              src="/brand/ansem.png"
              alt="$ansem — The Black Bull"
              width={34}
              height={34}
              className="size-[34px] object-cover"
              priority
            />
          </span>
          <span className="leading-none">
            <span className="block font-mono text-[13px] uppercase tracking-[0.08em] sm:text-sm">
              🐂 ansem<span className="text-accent">.tips</span>
            </span>
            <span className="mt-0.5 block font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted group-hover:text-accent/80">
              The Black Bull
            </span>
          </span>
        </Link>

        <nav
          className="nav-links-desktop items-center gap-1"
          aria-label="Primary"
        >
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link"
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="nav-menu-btn"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="nav-drawer" aria-label="Mobile">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link"
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
