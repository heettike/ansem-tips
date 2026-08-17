import { LikeTipAnim } from "@/components/LikeTipAnim";
import { OnboardFund } from "@/components/OnboardFund";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function OnboardPage() {
  const allowlist = config.tipperAllowlist;
  const invited = allowlist.map((t) => `@${t}`).join(", ");
  const initial = {
    likeAmount: config.minTipUsd,
    commentAmount: config.minTipUsd,
    followAmount: config.minTipUsd,
    quoteAmount: config.minTipUsd,
    superTipAmount: Math.max(1, config.minTipUsd),
    enabled: true,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 pb-16 pt-6">
      {/* intro poster — mechanic + animation */}
      <section className="poster-card">
        <div className="flex items-center justify-between gap-4">
          <p className="brand-text">
            ansem<span className="mark">.tips</span>
          </p>
          <span className="pill">tipper</span>
        </div>

        <h1 className="display mt-10 max-w-[85%] text-[clamp(2rem,7vw,3rem)]">
          like someone.
          <br />
          $ansem leaves your wallet for theirs.
        </h1>
        <p className="mt-5 max-w-lg text-lg text-muted">
          reply, follow, qt — same thing. drop 🐂 and they get more.
        </p>
        <p className="mt-4 max-w-lg">
          each time you like / reply / follow / qt / drop 🐂, we send $ansem from your wallet to theirs.
        </p>

        <LikeTipAnim />
      </section>

      {/* the rules */}
      <section className="poster-card">
        <div className="flex items-center justify-between gap-4">
          <p className="brand-text">
            ansem<span className="mark">.tips</span>
          </p>
          <span className="pill">the rules</span>
        </div>

        <dl className="mt-10 divide-y divide-black/[0.08] border-y border-black/[0.08]">
          <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-6">
            <dt className="text-muted">amounts</dt>
            <dd>
              you set each one. minimum ${config.minTipUsd} per action.
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-6">
            <dt className="text-muted">replies</dt>
            <dd>
              only tip when they contain your trigger — default
              &quot;lfg&quot;. yours can be any word or emoji.
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-6">
            <dt className="text-muted">super tip</dt>
            <dd>
              a reply or qt with your super-tip trigger — default 🐂 — pays
              your bigger super-tip amount.
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-6">
            <dt className="text-muted">deposit</dt>
            <dd>minimum ${config.minDepositUsd}.</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-6">
            <dt className="text-muted">wallet</dt>
            <dd>log in with x. privy creates your wallet.</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-6">
            <dt className="text-muted">claims</dt>
            <dd>
              recipients claim at the withdraw page — they can check waiting
              tips by x username before logging in. unclaimed tips return to
              you after 30 days.
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-6">
            <dt className="text-muted">chains</dt>
            <dd>any coin, any chain is coming. today: $ansem on solana.</dd>
          </div>
        </dl>

        <p className="mt-8 max-w-lg text-muted">
          open waitlist. live now: <span className="text-black">{invited}</span>
        </p>
        <p className="mt-2 max-w-lg text-muted">
          log in with x to join — we approve tippers by hand.
        </p>
      </section>

      <OnboardFund
        minDepositUsd={config.minDepositUsd}
        minTip={config.minTipUsd}
        allowlist={allowlist}
        initial={initial}
      />
    </div>
  );
}
