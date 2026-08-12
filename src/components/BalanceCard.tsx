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
      <p className="label-mono">{title}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">
        {main.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
        <span className="text-base text-accent-2">$ansem</span>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted">
        <div>
          <p className="label-mono text-[0.6rem]">Deposited</p>
          <p className="mt-0.5 font-mono text-foreground">
            {balance.deposited.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="label-mono text-[0.6rem]">Withdrawable</p>
          <p className="mt-0.5 font-mono text-foreground">
            {balance.withdrawable.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="label-mono text-[0.6rem]">Lifetime sent</p>
          <p className="mt-0.5 font-mono text-foreground">
            {balance.lifetimeSent.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="label-mono text-[0.6rem]">Lifetime received</p>
          <p className="mt-0.5 font-mono text-foreground">
            {balance.lifetimeReceived.toFixed(2)}
          </p>
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
