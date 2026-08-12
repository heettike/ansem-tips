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
    <div>
      <p className="text-sm text-muted">recent tips</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-[#222]">
              <th className="pb-3 pr-4 font-medium">action</th>
              <th className="pb-3 pr-4 font-medium">to</th>
              <th className="pb-3 pr-4 font-medium">amount</th>
              <th className="pb-3 pr-4 font-medium">status</th>
              <th className="pb-3 font-medium">when</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((t) => (
              <tr key={t.id} className="border-b border-[#222]">
                <td className="py-4 pr-4">
                  {t.actionType === "super_tip" ? (
                    <span className="mark">🐂 super</span>
                  ) : (
                    t.actionType
                  )}
                </td>
                <td className="py-4 pr-4">@{t.toXUsername}</td>
                <td className="py-4 pr-4 gold">
                  {t.amount} $ansem
                </td>
                <td className="py-4 pr-4 text-muted">{t.status}</td>
                <td className="py-4 text-muted">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {tips.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-muted">
                  no tips yet — go touch grass (and tweets).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
