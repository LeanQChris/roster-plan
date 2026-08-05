import { Suspense } from "react";
import AuditLogView from "./audit-log-view";

export default function AuditLogPage() {
  return (
    <Suspense fallback={null}>
      <AuditLogView />
    </Suspense>
  );
}