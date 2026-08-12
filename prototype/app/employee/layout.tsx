import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import EmployeeNav from "@/components/employee/EmployeeNav";
import { CompanyProvider } from "@/lib/company-data";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["employee"]}>
      <CompanyProvider>
        <div className="flex min-h-screen bg-canvas">
          <EmployeeNav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-8">
            {children}
          </main>
        </div>
      </CompanyProvider>
    </AuthGuard>
  );
}
