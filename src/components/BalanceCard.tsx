import type { BalanceView } from "@/types";

export function BalanceCard({
  title,
  balance,
  highlight = "deposited",
}: {
  title: string;
  balance: BalanceView;
  highlight?: "deposited" | "withdrawable";
}) {
  const main =
    highlight === "withdrawable" ? balance.withdrawable : balance.deposited;
  return (
    <div>
      <p className="text-sm text-muted">{title}</p>
      <p className="display mt-3 text-5xl">
        <span className="gold">
          {main.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
      </p>
      <p className="mt-2 text-sm text-muted">$ansem</p>
      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div>
          <dt className="text-muted">deposited</dt>
          <dd className="mt-1">{balance.deposited.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-muted">withdrawable</dt>
          <dd className="mt-1">{balance.withdrawable.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-muted">sent</dt>
          <dd className="mt-1">{balance.lifetimeSent.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-muted">received</dt>
          <dd className="mt-1">{balance.lifetimeReceived.toFixed(2)}</dd>
        </div>
      </dl>
      {balance.walletAddress && (
        <p className="mt-6 truncate text-xs text-muted">
          wallet: {balance.walletAddress}
        </p>
      )}
    </div>
  );
}
