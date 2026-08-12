type TipRow = {
  id: string;
  actionType: string;
  toXUsername: string;
  amount: number;
  status: string;
  txSig?: string | null;
  createdAt: string;
};

export function TipsTable({ tips }: { tips: TipRow[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="panel-head">
        <h3>Recent tips</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-white/[0.02] font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">To</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((t) => (
              <tr key={t.id} className="border-t border-card-border/70">
                <td className="px-5 py-3">
                  <span
                    className={
                      t.actionType === "super_tip" ? "badge badge-bull" : "badge"
                    }
                  >
                    {t.actionType === "super_tip" ? "🐂 super" : t.actionType}
                  </span>
                </td>
                <td className="px-5 py-3">@{t.toXUsername}</td>
                <td className="px-5 py-3 font-mono">
                  {t.amount} <span className="text-accent-2">$ansem</span>
                </td>
                <td className="px-5 py-3 capitalize text-muted">{t.status}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {tips.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6">
                  <div className="empty-state">
                    <p className="empty-title">No tips yet</p>
                    <p className="empty-body">
                      Go touch some tweets. Likes, replies, follows, QTs — and
                      🐂 for more.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
