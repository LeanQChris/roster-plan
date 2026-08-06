import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import CompanyNav from "@/components/company/CompanyNav";

export default function CompanyLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["company_admin"]}>
      <div className="flex min-h-screen bg-canvas">
        <CompanyNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}