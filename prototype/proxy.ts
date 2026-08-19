import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Optimistic cookie-presence check only — NOT a security boundary.
// Real authorization lives in RLS (data source) and lib/supabase/dal.ts
// (requireRole, used in Server Components/Actions). This just pre-filters
// obviously-unauthenticated requests away from protected routes and keeps
// the session cookie refreshed on every request.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/accept-invite",
  "/auth/callback",
  "/auth/confirm",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
