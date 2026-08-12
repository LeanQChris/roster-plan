"use client";

import { useTeamDetail } from "../team-detail-context";
import TeamAuditList from "@/components/manager/TeamAuditList";

export default function ManagerTeamAuditPage() {
  const { teamAuditLog } = useTeamDetail();
  return <TeamAuditList entries={teamAuditLog} />;
}
