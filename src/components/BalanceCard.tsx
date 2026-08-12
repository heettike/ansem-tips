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
    <div className="card p-5">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">
        {main.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
        <span className="text-base text-accent-2">$ansem</span>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted">
        <div>
          <p className="text-xs uppercase tracking-wide">Deposited</p>
          <p className="text-foreground">{balance.deposited.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide">Withdrawable</p>
          <p className="text-foreground">{balance.withdrawable.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide">Lifetime sent</p>
          <p className="text-foreground">{balance.lifetimeSent.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide">Lifetime received</p>
          <p className="text-foreground">{balance.lifetimeReceived.toFixed(2)}</p>
        </div>
      </div>
      {balance.walletAddress && (
        <p className="mt-3 truncate font-mono text-xs text-muted">
          wallet: {balance.walletAddress}
        </p>
      )}
    </div>
  );
}
