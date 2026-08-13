import { DashboardGate } from "@/components/DashboardGate";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardGate allowlist={config.tipperAllowlist} />;
}
