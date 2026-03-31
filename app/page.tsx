import { getMonitorStatuses } from "@/lib/status";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const statuses = getMonitorStatuses();
  return <DashboardClient initial={statuses} />;
}
