"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { homeForRole, useAuth } from "@/lib/auth";
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
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return; // wait for Supabase session to load on mount
    if (!user) {
      router.replace(redirectTo);
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(homeForRole(user.role));
    }
  }, [ready, user, router, allowedRoles, redirectTo]);

  if (!ready) return null;
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
