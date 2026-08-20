"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function resolveAppOrigin(headerList: Headers) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const forwardedHost = headerList.get("x-forwarded-host");
  const forwardedProto = headerList.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  const origin = headerList.get("origin");
  if (origin) return origin;

  const host = headerList.get("host");
  if (host) {
    const proto = host.includes("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export async function signInWithMicrosoft(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") ?? "/mes-demandes");
  const safePath =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/mes-demandes";

  const headerList = await headers();
  const origin = resolveAppOrigin(headerList);
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(safePath)}`;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: callbackUrl,
      scopes: "email openid profile",
    },
  });

  if (error || !data.url) {
    redirect(
      `/login?error=${encodeURIComponent(
        error?.message ??
          "Provider Azure inactif ou mal configuré dans Supabase (Authentication → Providers → Azure)."
      )}&redirectTo=${encodeURIComponent(safePath)}`
    );
  }

  redirect(data.url);
}
