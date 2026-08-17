"use client";

import { useEffect, useRef, useState } from "react";
import { Tweet } from "react-tweet";

/* the full community wall from the farcaster era onward, newest first */
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
  "1939569590054330539",
  "1939403303412252778",
  "1939020231835558044",
  "1938974922027794740",
  "1938870250503905754",
  "1938571104702087208",
  "1938029989267734684",
  "1937496252645769544",
  "1950108627718508670",
  "1940060321085104413",
  "1950103973739786289",
  "1932871119951806556",
  "1949702515777589532",
  "1949560028106723399",
  "1949499955812634910",
  "1949430632200786334",
  "1933642631156056458",
  "1934718997402145152",
  "1947308835729023274",
  "1947230647002525965",
  "1945706927893426373",
  "1945613672216498644",
  "1945675584698507379",
  "1945242925262053532",
  "1945211121092174070",
  "1945014230199005328",
  "1940789219318026753",
  "1943699511706013780",
  "1943458321060475024",
  "1939803209243267448",
  "1942940320607686920",
  "1942698995631153587",
  "1942672264086036686",
  "1942521478538244135",
  "1942242594286600534",
  "1949991967804264747",
  "1949837046194827479",
  "1943061848343089205",
  "1949832999291240611",
  "1947029312789741723",
  "1946475419878002706",
  "1946478573579313332",
  "1940912300703338715",
  "1937419702306791588",
  "1937477808525103148",
  "1937334980020940890",
  "1934408981486637093",
  "1935794965713457545",
  "1932942569421615447",
  "1935005161224839551",
  "1932470078890738147",
] as const;

/* mounts the tweet only when its cell nears the viewport — 63 tweets, zero
   upfront fetch storm */
function LazyTweet({ id }: { id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    <div ref={ref} className="tweet-cell mb-6 break-inside-avoid">
      {show ? <Tweet id={id} /> : <div className="tweet-placeholder" />}
    </div>
  );
}

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
          <LazyTweet key={id} id={id} />
        ))}
      </div>
    </section>
  );
}
