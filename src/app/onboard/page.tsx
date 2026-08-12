import Link from "next/link";
import { LiveTipSettingsForm } from "@/components/LiveTipSettingsForm";
import { LoginButton } from "@/components/LoginButton";
import { config, isAllowlistedTipper } from "@/lib/config";
import { DEMO_SETTINGS } from "@/lib/demo";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const tipper = config.tipperAllowlist[0] || "heettike";
  const allowed = isAllowlistedTipper(tipper);
  const user = await prisma.user.findFirst({
    where: { username: tipper },
    include: { tipSettings: true, balance: true },
  });
  const wallet =
    user?.walletAddress ||
    "log in with x — your deposit address shows up here";
  const initial = user?.tipSettings
    ? {
        likeAmount: user.tipSettings.likeAmount,
        commentAmount: user.tipSettings.commentAmount,
        followAmount: user.tipSettings.followAmount,
        quoteAmount: user.tipSettings.quoteAmount,
        superTipAmount: user.tipSettings.superTipAmount,
        enabled: user.tipSettings.enabled,
      }
    : {
        ...DEMO_SETTINGS,
        likeAmount: config.minTipUsd,
        commentAmount: config.minTipUsd,
        followAmount: config.minTipUsd,
        quoteAmount: config.minTipUsd,
        superTipAmount: Math.max(1, config.minTipUsd),
      };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm text-muted">tipper</p>
      <h1 className="display mt-4 text-4xl sm:text-6xl">
        connect → fund → tip
      </h1>
      <p className="mt-5 max-w-md text-muted">
        allowlist: <span className="text-white">@{tipper}</span>
        {config.tipperAllowlist.length > 1 && (
          <>
            {" "}
            (+{" "}
            {config.tipperAllowlist
              .slice(1)
              .map((t) => `@${t}`)
              .join(", ")}
            )
          </>
        )}
      </p>

      {!allowed && (
        <div className="mt-8 border border-danger p-4 text-sm text-danger">
          you&apos;re not on the tipper list. ask whoever runs this.
        </div>
      )}

      <ol className="mt-16 space-y-12">
        <li>
          <p className="text-sm text-muted">01</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            log in with x
          </h2>
          <p className="mt-3 text-muted">
            one login. we create your tip deposit wallet. don&apos;t paste keys.
          </p>
          <div className="mt-5">
            <LoginButton label="continue with x" />
          </div>
        </li>

        <li>
          <p className="text-sm text-muted">02</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            deposit min ${config.minDepositUsd} $ansem
          </h2>
          <p className="mt-3 text-muted">
            send $ansem to your deposit address. funded so far:{" "}
            <span className="gold">
              ${(user?.balance?.deposited ?? 0).toFixed(2)}
            </span>
          </p>
          <div className="mt-5 border border-[#222] p-4 text-sm break-all text-muted">
            {wallet}
          </div>
        </li>

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
