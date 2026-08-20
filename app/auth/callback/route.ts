import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;

  // Sur Vercel, préférer l'URL publique de l'app
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : url.origin);

  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");
  const nextRaw = searchParams.get("next") ?? "/mes-demandes";
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/mes-demandes";

  if (oauthError) {
    const message =
      oauthDescription?.replace(/\+/g, " ") ||
      oauthError ||
      "Erreur OAuth Microsoft";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    );
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error.message || "Échange de session Microsoft impossible"
      )}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Retour Microsoft sans code. Vérifiez Redirect URLs Supabase + URI Entra (…/auth/v1/callback)."
    )}`
  );
}
