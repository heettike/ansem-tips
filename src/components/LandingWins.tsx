import Link from "next/link";

const WINS = [
  "listed on coinbase",
  "won base batches",
  "backed by cbv + balaji",
] as const;

export function LandingWins() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-muted">before this</p>
        <h2 className="display mt-6 text-[clamp(2.25rem,7vw,4.5rem)]">
          the same engine ran
          <br />
          tipping on farcaster.
        </h2>

        <ul className="mt-12 divide-y divide-[#222] border-y border-[#222]">
          {WINS.map((w) => (
            <li key={w} className="py-5 text-xl font-bold sm:text-2xl">
              {w}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-muted">
          tips processed — · value moved —
        </p>

        {/* claim + chains — quiet facts, small type */}
        <div className="mt-24 max-w-xl">
          <p className="text-lg text-white sm:text-xl">
            got tipped? check what&apos;s waiting by your x username — no login
            needed.
          </p>
          <p className="mt-3 text-muted">
            unclaimed tips return to the creator after 30 days.
          </p>
          <p className="mt-3 text-muted">
            any coin, any chain — starting with{" "}
            <span className="gold">$ansem</span> on solana.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-8 text-lg font-bold">
            <Link
              href="/withdraw"
              className="text-white underline decoration-white underline-offset-8 hover:text-accent hover:decoration-accent"
            >
              claim your tips
            </Link>
            <Link
              href="/onboard"
              className="text-muted underline decoration-[#333] underline-offset-8 hover:text-white hover:decoration-white"
            >
              start tipping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
