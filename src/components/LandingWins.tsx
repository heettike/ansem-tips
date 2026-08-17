import Link from "next/link";

const WINS = [
  "listed on coinbase",
  "won base batches",
  "backed by cbv + balaji",
] as const;

export function LandingWins() {
  return (
    <section className="section-dark section-gap section-pad">
      <div className="wrap">
        <p className="micro-label">before this</p>

        <h2 className="display display-section mt-6 max-w-[85%]">
          the same engine ran
          <br />
          tipping on farcaster.
        </h2>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="card-on-dark p-8 sm:p-10">
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {WINS.map((w) => (
                <li key={w} className="py-5 text-xl sm:text-2xl">
                  {w}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <p className="display text-[clamp(3rem,8vw,5.5rem)] tabular-nums">
                27307
              </p>
              <p className="micro-label mt-3">noice powered tips</p>
            </div>

            <p className="mt-6 text-sm text-white/40">$$ moved —</p>
          </div>

          {/* quiet pastel atmosphere on the dark surface */}
          <div className="gradient-orb-card orb-field h-64 border-white/[0.06] bg-[#1c1917] md:h-auto md:min-h-[280px]">
            <div
              className="orb orb-sky"
              style={{ width: 340, height: 340, top: "-15%", left: "-10%" }}
              aria-hidden="true"
            />
            <div
              className="orb orb-rose"
              style={{ width: 300, height: 300, bottom: "-20%", right: "-8%" }}
              aria-hidden="true"
            />
            <div
              className="orb orb-mint"
              style={{ width: 240, height: 240, top: "35%", left: "40%" }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* claim + chains — quiet facts, small type */}
        <div className="mt-24 flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-xl">
            <p className="text-lg text-white sm:text-xl">
              got tipped? check what&apos;s waiting by your x username — no
              login needed.
            </p>
            <p className="mt-3 text-white/40">
              unclaimed tips return to the creator after 30 days.
            </p>
            <p className="mt-3 text-white/40">
              any coin, any chain — starting with{" "}
              <span className="gold">$ansem</span> on solana.
            </p>
            <p className="mt-3 text-white/40">
              tokenising a trillion atomic units of attention everyday
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/withdraw" className="btn-primary">
              claim your tips
            </Link>
            <Link href="/onboard" className="btn-ghost">
              start tipping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
