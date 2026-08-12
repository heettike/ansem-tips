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
  { id: "like", label: "LIKE", x: 210, y: 22, delay: "0s", dur: "2.6s" },
  { id: "reply", label: "REPLY", x: 210, y: 68, delay: "0.35s", dur: "2.7s" },
  { id: "follow", label: "FOLLOW", x: 210, y: 114, delay: "0.7s", dur: "2.8s" },
  { id: "qt", label: "QT", x: 210, y: 160, delay: "1.05s", dur: "2.9s" },
  {
    id: "bull",
    label: "🐂 SUPER",
    x: 210,
    y: 206,
    delay: "1.4s",
    dur: "3s",
    gold: true,
  },
];

const NODE_W = 96;
const NODE_H = 30;

/** CSS/SVG tip flow: tipper → engagement wallets. No WebGL / heavy blur. */
export function TipFlowAnim() {
  return (
    <div className="tip-flow card-terminal" aria-hidden="true">
      <svg
        className="tip-flow-svg"
        viewBox="0 0 320 270"
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
        <rect width="320" height="270" fill="url(#tip-grid)" />

        {/* Tipper — square node */}
        <rect
          className="tip-node-pulse"
          x="18"
          y="112"
          width="72"
          height="46"
          fill="#0a0a0a"
          stroke="#b6ff3b"
          strokeWidth="1.75"
        />
        <text
          x="54"
          y="130"
          textAnchor="middle"
          fill="#9ca3af"
          fontFamily="ui-monospace, monospace"
          fontSize="9"
          letterSpacing="1.2"
        >
          TIPPER
        </text>
        <text
          x="54"
          y="146"
          textAnchor="middle"
          fill="#b6ff3b"
          fontFamily="ui-monospace, monospace"
          fontSize="13"
          fontWeight="700"
        >
          YOU
        </text>

        {TARGETS.map((t) => (
          <g key={t.id}>
            <line
              className="flow-path"
              x1="90"
              y1="135"
              x2={t.x - 2}
              y2={t.y + NODE_H / 2}
              stroke={t.gold ? "rgba(245,185,66,0.55)" : "rgba(182,255,59,0.35)"}
              strokeWidth="1.25"
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
              strokeWidth="1.5"
            />
            <text
              x={t.x + NODE_W / 2}
              y={t.y + 20}
              textAnchor="middle"
              fill={t.gold ? "#f5b942" : "#b6ff3b"}
              fontFamily="ui-monospace, monospace"
              fontSize="11"
              fontWeight="700"
              letterSpacing="0.8"
            >
              {t.label}
            </text>
          </g>
        ))}

        <text
          x="160"
          y="258"
          textAnchor="middle"
          fill="#9ca3af"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
          letterSpacing="1.4"
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
              left: "16.9%",
              top: "50%",
              "--dx": `${((t.x + NODE_W / 2 - 54) / 320) * 100}cqw`,
              "--dy": `${((t.y + NODE_H / 2 - 135) / 270) * 100}cqh`,
              "--delay": t.delay,
              "--dur": t.dur,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
