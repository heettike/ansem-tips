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
      <div className="border-b border-card-border px-5 py-3">
        <h3 className="font-semibold">Recent tips</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-muted">
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
                  <span className={t.actionType === "super_tip" ? "badge badge-bull" : "badge"}>
                    {t.actionType === "super_tip" ? "🐂 super" : t.actionType}
                  </span>
                </td>
                <td className="px-5 py-3">@{t.toXUsername}</td>
                <td className="px-5 py-3 font-mono">{t.amount} $ansem</td>
                <td className="px-5 py-3 capitalize text-muted">{t.status}</td>
                <td className="px-5 py-3 text-muted">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {tips.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  No tips yet — go touch some grass (and tweets).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
