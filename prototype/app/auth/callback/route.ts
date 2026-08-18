import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Redirect target for invite/confirmation email links. Exchanges the auth
// code for a session, then forwards to `next` (defaults to "/" — role-based
// routing happens client-side once the profile loads).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
