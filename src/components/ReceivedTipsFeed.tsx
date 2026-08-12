"use client";

type ReceivedTip = {
  id: string;
  actionType: string;
  amount: number;
  amountUsd?: number;
  status: string;
  createdAt: string;
  fromUsername: string;
  tweetId: string | null;
  tweetUrl: string | null;
};

const ACTION_LABEL: Record<string, string> = {
  like: "liked",
  comment: "commented on",
  reply: "replied to",
  quote: "quote-tweeted",
  follow: "followed you",
  super_tip: "super-tipped 🐂",
};

export function ReceivedTipsFeed({ tips }: { tips: ReceivedTip[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-card-border px-5 py-3">
        <h3 className="font-semibold">Tips you earned</h3>
        <p className="text-xs text-muted">
          What tippers did + how much landed (USD-notional $ansem)
        </p>
      </div>
      <ul className="divide-y divide-card-border/70">
        {tips.map((t) => {
          const verb = ACTION_LABEL[t.actionType] || t.actionType;
          const isFollow = t.actionType === "follow";
          const usd = t.amountUsd ?? t.amount;
          return (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">
                    @{t.fromUsername}
                  </span>{" "}
                  <span className="text-muted">{verb}</span>
                  {!isFollow && t.tweetUrl && (
                    <>
                      {" "}
                      <a
                        href={t.tweetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline"
                      >
                        this tweet
                      </a>
                    </>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(t.createdAt).toLocaleString()} · {t.status}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="badge badge-bull font-mono">
                  + ${usd.toFixed(2)}
                </span>
                <p className="mt-1 text-xs text-muted font-mono">
                  {t.amount.toFixed(2)} $ansem
                </p>
              </div>
            </li>
          );
        })}
        {tips.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-muted">
            No tips yet. Go be tippable.
          </li>
        )}
      </ul>
    </div>
  );
}
