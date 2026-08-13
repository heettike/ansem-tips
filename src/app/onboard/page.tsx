import Link from "next/link";
import { LikeTipAnim } from "@/components/LikeTipAnim";
import { LiveTipSettingsForm } from "@/components/LiveTipSettingsForm";
import { OnboardFund } from "@/components/OnboardFund";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function OnboardPage() {
  const allowlist = config.tipperAllowlist;
  const tipper = allowlist[0] || "heettike";
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
        each time you like / reply / follow / qt / drop 🐂, we send $ansem from
        your wallet to theirs.
      </p>

      <LikeTipAnim />

      <p className="mt-10 max-w-md text-muted">
        allowlist: <span className="text-white">@{tipper}</span>
        {allowlist.length > 1 && (
          <>
            {" "}
            (+{" "}
            {allowlist
              .slice(1)
              .map((t) => `@${t}`)
              .join(", ")}
            )
          </>
        )}
      </p>

      <ol className="mt-16 space-y-12">
        <OnboardFund
          minDepositUsd={config.minDepositUsd}
          allowlist={allowlist}
        />

        <li>
          <p className="mb-3 text-sm text-muted">03</p>
          <LiveTipSettingsForm initial={initial} minTip={config.minTipUsd} />
        </li>
      </ol>

      <div className="mt-16 flex flex-wrap gap-3">
        <Link href="/dashboard" className="btn-primary">
          open dash
        </Link>
        <Link href="/" className="btn-ghost">
          home
        </Link>
      </div>
    </div>
  );
}
