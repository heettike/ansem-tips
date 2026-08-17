"use client";

import { Tweet } from "react-tweet";

/* newest first — rendered lazily by react-tweet's own skeletons */
const TWEET_IDS = [
  "1977799724796424678",
  "1974183587235967313",
  "1968331883340763630",
  "1965646723436708229",
  "1964369353769636137",
  "1963527468523942364",
  "1963295506878402573",
  "1952838587688566912",
  "1951978786016412107",
  "1951651954951884938",
  "1951311923531678181",
  "1950854126826570149",
] as const;

export function CommunityWall() {
  return (
    <section className="poster-card poster-span-2 community-wall">
      <div className="flex items-center justify-between gap-4">
        <p className="brand-text">
          ansem<span className="mark">.tips</span>
        </p>
        <span className="pill">the community wall</span>
      </div>

      {/* .light forces react-tweet's light theme regardless of system scheme */}
      <div className="light mt-10 columns-1 gap-6 md:columns-2 xl:columns-3">
        {TWEET_IDS.map((id) => (
          <div key={id} className="tweet-cell mb-6 break-inside-avoid">
            <Tweet id={id} />
          </div>
        ))}
      </div>
    </section>
  );
}
