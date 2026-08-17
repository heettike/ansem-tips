"use client";

import { useEffect, useState } from "react";

type Stats = {
  ok: boolean;
  creators: number;
  totalTipped: number;
  totalTips: number;
  perCreator: { username: string; total: number }[];
};

const CREATORS = ["heettike", "blknoiz06", "srijancse"] as const;

function usd(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function LandingStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: Stats) => {
        if (alive && data?.ok) setStats(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const totals = new Map(
    (stats?.perCreator ?? []).map((c) => [c.username.toLowerCase(), c.total])
  );

  const figures: { value: string; label: string; gold?: boolean }[] = [
    {
      value: stats ? String(stats.creators) : "—",
      label: "creators tipping",
    },
    {
      value: stats ? usd(stats.totalTipped) : "—",
      label: "tipped so far",
      gold: true,
    },
    {
      value: stats ? stats.totalTips.toLocaleString("en-US") : "—",
      label: "tips paid out",
    },
  ];

  return (
    <>
      {/* core numbers */}
      <section className="poster-card">
        <div className="flex items-center justify-between gap-4">
          <p className="brand-text">
            ansem<span className="mark">.tips</span>
          </p>
          <span className="pill">right now</span>
        </div>

        <div className="mt-12 space-y-10">
          {figures.map((f) => (
            <div key={f.label}>
              <p
                className={`display text-5xl tabular-nums sm:text-6xl ${
                  f.gold ? "gold" : ""
                }`}
              >
                {f.value}
              </p>
              <p className="micro-label mt-3">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* allowlisted creators */}
      <section className="poster-card">
        <div className="flex items-center justify-between gap-4">
          <p className="brand-text">
            ansem<span className="mark">.tips</span>
          </p>
          <span className="pill">creators tipping</span>
        </div>

        <ul className="mt-12 divide-y divide-black/[0.08] border-y border-black/[0.08]">
          {CREATORS.map((handle) => {
            const total = totals.get(handle);
            return (
              <li
                key={handle}
                className="flex items-center justify-between gap-4 py-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {/* remote pfp — plain img, unavatar has no fixed host list for next/image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://unavatar.io/twitter/${handle}`}
                    alt={`@${handle}`}
                    width={44}
                    height={44}
                    loading="lazy"
                    className="h-11 w-11 shrink-0 rounded-full border border-black/[0.08] object-cover"
                  />
                  <a
                    href={`https://x.com/${handle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-bold hover:text-accent"
                  >
                    @{handle}
                  </a>
                </div>
                <p className="shrink-0 tabular-nums">
                  <span className="amount-gold font-bold">
                    {stats ? usd(total ?? 0) : "—"}
                  </span>{" "}
                  <span className="text-muted">tipped</span>
                </p>
              </li>
            );
          })}
        </ul>

        <p className="caption mt-8">
          any coin, any chain — starting with $ansem on solana.
        </p>
      </section>
    </>
  );
}
