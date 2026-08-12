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
  { id: "like", label: "LIKE", x: 198, y: 18, delay: "0s", dur: "2.6s" },
  { id: "reply", label: "REPLY", x: 198, y: 62, delay: "0.35s", dur: "2.7s" },
  { id: "follow", label: "FOLLOW", x: 198, y: 106, delay: "0.7s", dur: "2.8s" },
  { id: "qt", label: "QT", x: 198, y: 150, delay: "1.05s", dur: "2.9s" },
  {
    id: "bull",
    label: "🐂 SUPER",
    x: 198,
    y: 194,
    delay: "1.4s",
    dur: "3s",
    gold: true,
  },
];

const NODE_W = 108;
const NODE_H = 32;
const VB_W = 320;
const VB_H = 256;

/** CSS/SVG tip flow: tipper → engagement wallets. No WebGL / canvas / heavy blur. */
export function TipFlowAnim() {
  return (
    <div className="tip-flow card-terminal" aria-hidden="true">
      <svg
        className="tip-flow-svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
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
        <rect width={VB_W} height={VB_H} fill="url(#tip-grid)" />

        {/* Tipper — square node */}
        <rect
          className="tip-node-pulse"
          x="14"
          y="100"
          width="78"
          height="52"
          fill="#0a0a0a"
          stroke="#b6ff3b"
          strokeWidth="2"
        />
        <text
          x="53"
          y="120"
          textAnchor="middle"
          fill="#9ca3af"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
          letterSpacing="1.2"
        >
          TIPPER
        </text>
        <text
          x="53"
          y="138"
          textAnchor="middle"
          fill="#b6ff3b"
          fontFamily="ui-monospace, monospace"
          fontSize="14"
          fontWeight="700"
        >
          YOU
        </text>

        {TARGETS.map((t) => (
          <g key={t.id}>
            <line
              className="flow-path"
              x1="92"
              y1="126"
              x2={t.x - 2}
              y2={t.y + NODE_H / 2}
              stroke={t.gold ? "rgba(245,185,66,0.55)" : "rgba(182,255,59,0.4)"}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              style={{ animationDelay: t.delay }}
            />
            <rect
              x={t.x}
              y={t.y}
              width={NODE_W}
              height={NODE_H}
              fill="#0a0a0a"
              stroke={t.gold ? "#f5b942" : "#b6ff3b"}
              strokeWidth="1.75"
            />
            <text
              x={t.x + NODE_W / 2}
              y={t.y + 21}
              textAnchor="middle"
              fill={t.gold ? "#f5b942" : "#b6ff3b"}
              fontFamily="ui-monospace, monospace"
              fontSize="12"
              fontWeight="700"
              letterSpacing="0.9"
            >
              {t.label}
            </text>
          </g>
        ))}

        <text
          x={VB_W / 2}
          y={VB_H - 10}
          textAnchor="middle"
          fill="#9ca3af"
          fontFamily="ui-monospace, monospace"
          fontSize="11"
          letterSpacing="1.5"
        >
          ONE TIPPER → MANY WALLETS
        </text>
      </svg>

      {TARGETS.map((t) => (
        <span
          key={`p-${t.id}`}
          className={`tip-particle${t.gold ? " gold" : ""}`}
          style={
            {
              left: "16.6%",
              top: "49%",
              "--dx": `${((t.x + NODE_W / 2 - 53) / VB_W) * 100}cqw`,
              "--dy": `${((t.y + NODE_H / 2 - 126) / VB_H) * 100}cqh`,
              "--delay": t.delay,
              "--dur": t.dur,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
