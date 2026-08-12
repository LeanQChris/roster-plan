"use client";

import { useTeamDetail } from "../team-detail-context";
import TeamScheduleView from "@/components/schedule/TeamScheduleView";

export default function ManagerTeamSchedulePage() {
  const { team } = useTeamDetail();
  return <TeamScheduleView team={team} showHeader={false} />;
}
