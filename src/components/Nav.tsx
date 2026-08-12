import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/onboard", label: "Onboard" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/withdraw", label: "Withdraw" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-card-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="relative size-8 overflow-hidden rounded-full ring-1 ring-accent/40 shadow-[0_0_16px_rgba(182,255,59,0.25)]">
            <Image
              src="/brand/ansem.png"
              alt="$ansem — The Black Bull"
              width={32}
              height={32}
              className="size-8 object-cover"
              priority
            />
          </span>
          <span className="leading-none">
            <span className="block text-[15px] sm:text-base">
              🐂 ansem<span className="text-accent">.tips</span>
            </span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted group-hover:text-accent/80">
              The Black Bull
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-muted hover:bg-white/5 hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
