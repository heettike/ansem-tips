/**
 * one idea object: tip → herd → mission compounds.
 * visualize value network — one diagram, not a menu of features.
 */
import Image from "next/image";
import type { CSSProperties } from "react";

const VIEW = { w: 1000, h: 860 } as const;
const HUB = { x: 500, y: 400, r: 105 } as const;

function herdNodes() {
  const nodes: { cx: number; cy: number; r: number; delay: string }[] = [];
  const rings = [
    { count: 8, radius: 200, size: 7, baseDelay: 0.15 },
    { count: 16, radius: 285, size: 5.5, baseDelay: 0.45 },
    { count: 28, radius: 365, size: 4, baseDelay: 0.85 },
    { count: 42, radius: 440, size: 3, baseDelay: 1.3 },
  ];

  for (const ring of rings) {
    for (let i = 0; i < ring.count; i++) {
      const angle = (Math.PI * 2 * i) / ring.count - Math.PI / 2;
      const jitter = ((i % 5) - 2) * 2.2;
      nodes.push({
        cx: HUB.x + Math.cos(angle) * (ring.radius + jitter),
        cy: HUB.y + Math.sin(angle) * (ring.radius * 0.72 + jitter * 0.4),
        r: ring.size,
        delay: `${ring.baseDelay + i * 0.03}s`,
      });
    }
  }
  return nodes;
}

const NODES = herdNodes();
const RINGS = [200, 285, 365, 440];

const CHIPS: {
  amount: string;
  node: number;
  tone: "orange" | "blue";
  delay: string;
  duration: string;
}[] = [
  { amount: "$12", node: 0, tone: "orange", delay: "0s", duration: "6.2s" },
  { amount: "$19", node: 2, tone: "blue", delay: "3.6s", duration: "5.5s" },
  { amount: "$28", node: 4, tone: "orange", delay: "0.9s", duration: "5.8s" },
  { amount: "$47", node: 6, tone: "blue", delay: "1.8s", duration: "6.6s" },
  { amount: "$64", node: 9, tone: "orange", delay: "2.7s", duration: "7s" },
  { amount: "$73", node: 14, tone: "blue", delay: "4.4s", duration: "5.4s" },
  { amount: "$81", node: 19, tone: "orange", delay: "3.2s", duration: "6.8s" },
  { amount: "$100", node: 24, tone: "blue", delay: "1.3s", duration: "6.1s" },
];

const TONE = {
  orange: "#ff4d00",
  blue: "#0070f3",
} as const;

export function TipSpreadStory() {
  return (
    <section className="poster-card poster-span-2">
      <div className="flex items-center justify-between gap-4">
        <p className="brand-text">
          ansem<span className="mark">.tips</span>
        </p>
        <span className="pill">the herd</span>
      </div>

      <h2 className="display mt-10 max-w-[85%] text-[clamp(2rem,4.5vw,3.25rem)]">
        tip → herd →
        <br />
        <span className="mark">mission compounds</span>
      </h2>

      <div className="relative mt-14 sm:mt-16">
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="mx-auto h-auto w-full max-w-5xl"
          role="img"
          aria-label="ansem sending $ansem from one tipper into a growing network of wallets"
        >
          {RINGS.map((radius, i) => (
            <ellipse
              key={radius}
              className="vv-ring"
              cx={HUB.x}
              cy={HUB.y}
              rx={radius}
              ry={radius * 0.72}
              fill="none"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
              style={{ animationDelay: `${0.15 + i * 0.2}s` }}
            />
          ))}

          {NODES.filter((_, i) => i < 8).map((n, i) => (
            <line
              key={`spoke-${i}`}
              className="vv-line"
              x1={HUB.x}
              y1={HUB.y}
              x2={n.cx}
              y2={n.cy}
              stroke="#000000"
              strokeWidth="1.25"
              strokeOpacity="0.35"
              style={{ animationDelay: `${0.1 + i * 0.04}s` }}
            />
          ))}

          {NODES.slice(8, 24).map((n, i) => {
            const parent = NODES[i % 8];
            return (
              <line
                key={`link-${i}`}
                className="vv-line"
                x1={parent.cx}
                y1={parent.cy}
                x2={n.cx}
                y2={n.cy}
                stroke="#000000"
                strokeWidth="0.75"
                strokeOpacity="0.15"
                style={{ animationDelay: `${0.45 + i * 0.03}s` }}
              />
            );
          })}

          {NODES.map((n, i) => (
            <circle
              key={`node-${i}`}
              className="vv-node"
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              fill={
                i % 11 === 0 ? "#ff4d00" : i % 7 === 0 ? "#0070f3" : "#000000"
              }
              fillOpacity={i % 11 === 0 || i % 7 === 0 ? 0.95 : 0.7}
              style={{ animationDelay: n.delay }}
            />
          ))}

          <text
            x={HUB.x}
            y={HUB.y + HUB.r + 22}
            textAnchor="middle"
            fill="rgba(0,0,0,0.4)"
            fontSize="12"
            fontFamily="Helvetica, Arial, sans-serif"
          >
            @blknoiz06
          </text>

          <text
            x={HUB.x}
            y="820"
            textAnchor="middle"
            fill="rgba(0,0,0,0.4)"
            fontSize="16"
            fontFamily="Helvetica, Arial, sans-serif"
          >
            hundreds of wallets. reach keeps increasing.
          </text>
        </svg>

        <div
          className="pointer-events-none absolute left-1/2 top-0 h-full w-full max-w-5xl -translate-x-1/2"
          aria-hidden="true"
        >
          {CHIPS.map((chip) => {
            const n = NODES[chip.node];
            const color = TONE[chip.tone];
            const style = {
              "--end-x": `${(n.cx / VIEW.w) * 100}%`,
              "--end-y": `${(n.cy / VIEW.h) * 100}%`,
              animationDelay: chip.delay,
              animationDuration: chip.duration,
              color,
              borderColor: color,
            } as CSSProperties;
            return (
              <span key={chip.amount} className="vv-chip" style={style}>
                {chip.amount}
              </span>
            );
          })}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: "50%",
              top: `${(HUB.y / VIEW.h) * 100}%`,
              width: `${((HUB.r * 2) / VIEW.w) * 100}%`,
              zIndex: 2,
            }}
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-full border-[3px] border-black">
              <Image
                src="/brand/ansem-pfp.jpg"
                alt="ansem"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 21vw, 220px"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
        <p className="caption">
          one tipper sends $ansem outward. the herd pushes the black bull
          further. network effects compound.
        </p>
        <div className="meta-cluster">
          <div>
            <p className="micro-label">hub</p>
            <p className="value-text">@blknoiz06</p>
          </div>
          <div>
            <p className="micro-label">wallets</p>
            <p className="value-text">hundreds</p>
          </div>
        </div>
      </div>
    </section>
  );
}
