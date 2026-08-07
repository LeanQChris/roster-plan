import type { ReactNode } from "react";
import { AdminProvider } from "@/lib/store";
import AdminNav from "@/components/admin/AdminNav";
import AuthGuard from "@/components/AuthGuard";
import Toasts from "@/components/ui/Toasts";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AuthGuard allowedRoles={["super_admin"]}>
        <div className="flex min-h-screen flex-col bg-canvas">
          <AdminNav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-8">
            {children}
          </main>
          <Toasts />
        </div>
      </AuthGuard>
    </AdminProvider>
  );
}