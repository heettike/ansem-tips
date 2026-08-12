"use client";

import type { CSSProperties } from "react";

const TARGETS: {
  id: string;
  label: string;
  x: number;
  y: number;
  delay: string;
  dur: string;
  gold?: boolean;
}[] = [
  { id: "like", label: "like", x: 248, y: 28, delay: "0s", dur: "2.6s" },
  { id: "reply", label: "reply", x: 248, y: 78, delay: "0.35s", dur: "2.7s" },
  { id: "follow", label: "follow", x: 248, y: 128, delay: "0.7s", dur: "2.8s" },
  { id: "qt", label: "QT", x: 248, y: 178, delay: "1.05s", dur: "2.9s" },
  {
    id: "bull",
    label: "🐂 super",
    x: 248,
    y: 228,
    delay: "1.4s",
    dur: "3s",
    gold: true,
  },
];

/** CSS/SVG tip flow: tipper → engagement wallets. No WebGL / heavy blur. */
export function TipFlowAnim() {
  return (
    <div className="tip-flow card-terminal" aria-hidden="true">
      <svg
        className="tip-flow-svg"
        viewBox="0 0 340 290"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <title>Tips flow from one tipper to many wallets</title>

        <defs>
          <pattern id="tip-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" stroke="rgba(182,255,59,0.07)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="340" height="290" fill="url(#tip-grid)" />

        {/* Tipper */}
        <circle
          className="tip-node-pulse"
          cx="52"
          cy="145"
          r="28"
          fill="#0a0a0a"
          stroke="#b6ff3b"
          strokeWidth="1.75"
        />
        <text
          x="52"
          y="141"
          textAnchor="middle"
          fill="#9ca3af"
          fontFamily="ui-monospace, monospace"
          fontSize="7"
          letterSpacing="1.5"
        >
          TIPPER
        </text>
        <text
          x="52"
          y="155"
          textAnchor="middle"
          fill="#b6ff3b"
          fontFamily="ui-monospace, monospace"
          fontSize="11"
          fontWeight="700"
        >
          YOU
        </text>

        {TARGETS.map((t) => (
          <g key={t.id}>
            <line
              className="flow-path"
              x1="80"
              y1="145"
              x2={t.x - 4}
              y2={t.y + 12}
              stroke={t.gold ? "rgba(245,185,66,0.55)" : "rgba(182,255,59,0.35)"}
              strokeWidth="1.25"
              strokeDasharray="4 3"
              style={{ animationDelay: t.delay }}
            />
            <rect
              x={t.x}
              y={t.y}
              width={78}
              height="24"
              fill="#0a0a0a"
              stroke={t.gold ? "#f5b942" : "#22ff44"}
              strokeWidth="1.25"
              rx="2"
              ry="2"
            />
            <text
              x={t.x + 39}
              y={t.y + 16}
              textAnchor="middle"
              fill={t.gold ? "#f5b942" : "#b6ff3b"}
              fontFamily="ui-monospace, monospace"
              fontSize="9"
              fontWeight="700"
              letterSpacing="0.5"
            >
              {t.label}
            </text>
          </g>
        ))}

        <text
          x="170"
          y="278"
          textAnchor="middle"
          fill="#9ca3af"
          fontFamily="ui-monospace, monospace"
          fontSize="8"
          letterSpacing="1.5"
        >
          one tipper → many wallets
        </text>
      </svg>

      {TARGETS.map((t) => (
        <span
          key={`p-${t.id}`}
          className={`tip-particle${t.gold ? " gold" : ""}`}
          style={
            {
              left: "15.3%",
              top: "50%",
              "--dx": `${((t.x + 39 - 52) / 340) * 100}cqw`,
              "--dy": `${((t.y + 12 - 145) / 290) * 100}cqh`,
              "--delay": t.delay,
              "--dur": t.dur,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
