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
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm text-muted">tipper</p>
      <h1 className="display mt-4 text-4xl sm:text-6xl">
        like someone.
        <br />
        $ansem leaves your wallet for theirs.
      </h1>
      <p className="mt-5 max-w-lg text-lg text-muted">
        reply, follow, qt — same thing. drop 🐂 and they get more.
      </p>
      <p className="mt-4 max-w-lg text-white">
        each time you like / reply / follow / qt / drop 🐂, we send $ansem from your wallet to theirs.
      </p>

      <LikeTipAnim />

      <p className="mt-10 max-w-lg text-muted">
        invited: <span className="text-white">{invited}</span>
      </p>
      <p className="mt-2 max-w-lg text-muted">
        log in as you — you must be on the list.
      </p>

      <OnboardFund
        minDepositUsd={config.minDepositUsd}
        minTip={config.minTipUsd}
        allowlist={allowlist}
        initial={initial}
      />
    </div>
  );
}
