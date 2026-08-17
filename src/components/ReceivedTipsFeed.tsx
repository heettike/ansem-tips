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
    <div>
      <p className="micro-label">tips you earned</p>
      <ul className="mt-6 divide-y divide-[#f0efed] border-y border-[#e7e5e4]">
        {tips.map((t) => {
          const verb = ACTION_LABEL[t.actionType] || t.actionType;
          const isFollow = t.actionType === "follow";
          const usd = t.amountUsd ?? t.amount;
          return (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 py-5"
            >
              <div className="min-w-0 flex-1">
                <p>
                  <span className="font-medium text-ink">@{t.fromUsername}</span>{" "}
                  <span className="text-muted">{verb}</span>
                  {!isFollow && t.tweetUrl && (
                    <>
                      {" "}
                      <a
                        href={t.tweetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink underline-offset-4 hover:underline"
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
                <p className="font-medium gold">+ ${usd.toFixed(2)}</p>
                <p className="mt-1 text-xs text-muted">
                  {t.amount.toFixed(2)} $ansem
                </p>
              </div>
            </li>
          );
        })}
        {tips.length === 0 && (
          <li className="py-10 text-sm text-muted">
            no tips yet. go be tippable.
          </li>
        )}
      </ul>
    </div>
  );
}
