"use client";

export type WithdrawalRow = {
  id: string;
  amount: number;
  amountUsd?: number;
  toAddress: string;
  txSig: string;
  status: string;
  createdAt: string;
  solscanUrl: string;
  addressUrl?: string;
};

function shortAddr(a: string) {
  if (a.length <= 12) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export function WithdrawalHistory({
  withdrawals,
}: {
  withdrawals: WithdrawalRow[];
}) {
  return (
    <div className="card overflow-hidden">
      <div className="panel-head">
        <h3>Withdrawal history</h3>
        <p className="mt-1 text-xs text-muted">
          Past cash-outs · verify on Solscan
        </p>
      </div>
      <ul className="divide-y divide-card-border/70">
        {withdrawals.map((w) => (
          <li
            key={w.id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold text-foreground">
                  {(w.amountUsd ?? w.amount).toFixed(2)}
                </span>{" "}
                <span className="text-muted">
                  · {w.amount.toFixed(2)} $ansem
                </span>
              </p>
              <p className="mt-1 font-mono text-xs text-muted">
                {new Date(w.createdAt).toLocaleString()} · to{" "}
                <a
                  href={
                    w.addressUrl ||
                    `https://solscan.io/account/${w.toAddress}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  {shortAddr(w.toAddress)}
                </a>
              </p>
            </div>
            <a
              href={w.solscanUrl}
              target="_blank"
              rel="noreferrer"
              className="badge badge-bull shrink-0 hover:underline"
            >
              Solscan ↗
            </a>
          </li>
        ))}
        {withdrawals.length === 0 && (
          <li className="px-5 py-6">
            <div className="empty-state">
              <p className="empty-title">No withdrawals yet</p>
              <p className="empty-body">
                When you cash out, the history lands here.
              </p>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}
