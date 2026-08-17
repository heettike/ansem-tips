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
    <div>
      <p className="micro-label">past withdrawals</p>
      <ul className="mt-6 divide-y divide-[#f0efed] border-y border-[#e7e5e4]">
        {withdrawals.map((w) => (
          <li
            key={w.id}
            className="flex flex-wrap items-center justify-between gap-3 py-5"
          >
            <div className="min-w-0 flex-1">
              <p>
                <span className="font-medium gold">
                  ${(w.amountUsd ?? w.amount).toFixed(2)}
                </span>{" "}
                <span className="text-muted">
                  · {w.amount.toFixed(2)} $ansem
                </span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {new Date(w.createdAt).toLocaleString()} · to{" "}
                <a
                  href={
                    w.addressUrl ||
                    `https://solscan.io/account/${w.toAddress}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink underline-offset-4 hover:underline"
                >
                  {shortAddr(w.toAddress)}
                </a>
              </p>
            </div>
            <a
              href={w.solscanUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-ink underline underline-offset-4 hover:text-muted"
            >
              receipt →
            </a>
          </li>
        ))}
        {withdrawals.length === 0 && (
          <li className="py-10 text-sm text-muted">no withdrawals yet.</li>
        )}
      </ul>
    </div>
  );
}
