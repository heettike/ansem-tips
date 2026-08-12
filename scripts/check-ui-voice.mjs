/**
 * Guard: Visualize Value landing + no CRT regression.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src/app", "src/components"];
const ban = [
  /\b420\.69\b/,
  /DemoTipper/,
  /\bGeist\b/,
  /\bInter\b/,
  /\bArchivo\b/,
  /\bshadcn\b/i,
  /\blucide\b/i,
  /\bToken-2022\b/,
  /\bOAuth\b/,
  /\bSPL\b/,
  /\bledger\b/i,
  /\bATA\b/,
  /scanline/i,
  /crt-shell/i,
  /crt\b/i,
  /grid-noise/,
  /vignette/,
  /marquee/i,
  /\bblink\b/,
  /stadium/i,
  /text-transform:\s*uppercase/,
  /box-shadow:[^;]*rgba\(182,\s*255/i,
];

const allowPath = (p) =>
  p.includes("/api/") ||
  p.includes("/lib/") ||
  p.includes("Privy") ||
  p.includes("types/") ||
  p.endsWith("check-ui-voice.mjs");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|css)$/.test(name)) out.push(p);
  }
  return out;
}

const files = roots.flatMap((r) => walk(r)).filter((p) => !allowPath(p));
let failures = 0;

for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const re of ban) {
    if (re.source.includes("DemoTipper") && file.endsWith("LoginButton.tsx")) {
      continue;
    }
    if (re.test(text)) {
      console.error(`FAIL ${file} matches ${re}`);
      failures++;
    }
  }
}

const landing = readFileSync("src/components/LandingHero.tsx", "utf8");
const spread = readFileSync("src/components/TipSpreadStory.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");
const layout = readFileSync("src/app/layout.tsx", "utf8");
const nav = readFileSync("src/components/Nav.tsx", "utf8");
const providers = readFileSync("src/components/Providers.tsx", "utf8");

const must = [
  [landing, /ansem[\s\S]*?\.tips/, "landing brand lockup"],
  [landing, /1_photo\.jpg/, "full-bleed bull art"],
  [landing, /h-\[90vh\]|h-screen/, "confident full-bleed height"],
  [landing, /TipSpreadStory/, "network diagram mounted"],
  [landing, /the black bull/, "black bull subtitle"],
  [
    landing,
    /for tippers|for recipients|connect\.\s*fund|>\s*01\s*<|>\s*02\s*|feature card/i,
    "no tipper steps / second idea on landing",
    true,
  ],
  [spread, /circle/, "vv circle diagram"],
  [spread, /tipper/, "tipper node"],
  [spread, /herd|compounds|network/i, "network-effects idea"],
  [spread, /hundreds/, "scale language"],
  [
    spread,
    /\blike\b|\breply\b|\bfollow\b|\bqt\b|super tip|tip actions/i,
    "diagram must not list tip actions",
    true,
  ],
  [css, /#000000|#000\b/, "pure black canvas"],
  [css, /text-transform:\s*lowercase/, "lowercase system"],
  [css, /Helvetica/, "quiet grotesque"],
  [css, /--accent:\s*#b6ff3b/, "sparse acid green"],
  [css, /scanline|crt-shell|grid-noise|vignette/i, "no crt leftovers in css", true],
  [nav, /pathname === "\/"/, "nav hidden on landing"],
  [layout, /from "next\/font\/google"/, "no next/font google flex", true],
  [layout, /crt-shell/i, "no crt-shell on body", true],
  [providers, /return <>\{children\}<\/>/, "privy not at root"],
];

for (const row of must) {
  const [src, re, label, invert] = row;
  const hit = re.test(src);
  if (invert ? hit : !hit) {
    console.error(`FAIL ${invert ? "unwanted" : "missing"}: ${label}`);
    failures++;
  }
}

// CRT components must be gone
for (const dead of [
  "src/components/TipFlowAnim.tsx",
  "src/components/SpreadStory.tsx",
]) {
  try {
    readFileSync(dead);
    console.error(`FAIL crt file still exists: ${dead}`);
    failures++;
  } catch {
    /* good */
  }
}

if (failures) {
  console.error(`\n${failures} ui voice check(s) failed`);
  process.exit(1);
}
console.log(`OK — ${files.length} ui files clean + vv critic blockers cleared`);
