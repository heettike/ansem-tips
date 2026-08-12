/** Client-safe public env — always trimmed (Vercel env UI/CLI often adds \\n). */
export const publicEnv = {
  privyAppId: (process.env.NEXT_PUBLIC_PRIVY_APP_ID || "").trim(),
  demoMode: (process.env.NEXT_PUBLIC_DEMO_MODE || "").trim() === "true",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || "").trim() || "https://ansem-tips.vercel.app",
};
