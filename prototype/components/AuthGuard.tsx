"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import type { AuthRole } from "@/lib/auth";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: AuthRole[];
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  allowedRoles,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace(redirectTo);
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === "super_admin" ? "/admin" : "/dashboard");
    }
  }, [user, router, allowedRoles, redirectTo]);

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
