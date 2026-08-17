import Link from "next/link";
import { ShaderCanvas } from "@/components/ShaderCanvas";

const WINS = [
  "listed on coinbase",
  "won base batches",
  "backed by cbv + balaji",
] as const;

export function LandingWins() {
  return (
    <section className="poster-card poster-card-dark pixel-grid poster-span-2">
      <div className="flex items-center justify-between gap-4">
        <p className="brand-text">
          ansem<span className="mark">.tips</span>
        </p>
        <span className="pill">before this</span>
      </div>

      <h2 className="display mt-10 max-w-[85%] text-[clamp(2rem,4.5vw,3.25rem)]">
        the same engine ran
        <br />
        tipping on farcaster.
      </h2>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {WINS.map((w) => (
              <li key={w} className="py-5 text-xl font-bold sm:text-2xl">
                {w}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className="display font-mono text-[clamp(3rem,8vw,5.5rem)] tabular-nums">
              27307
            </p>
            <p className="micro-label mt-3">noice powered tips</p>
          </div>

          <p className="mt-6 text-sm text-white/40">$$ moved —</p>
        </div>

        <div className="shader-frame h-64 md:h-auto md:min-h-[280px]">
          <ShaderCanvas variant="pixels" className="absolute inset-0" />
        </div>
      </div>

      {/* claim + chains — quiet facts, small type */}
      <div className="mt-16 flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-xl">
          <p className="text-lg text-white sm:text-xl">
            got tipped? check what&apos;s waiting by your x username — no login
            needed.
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
    </section>
  );
}
