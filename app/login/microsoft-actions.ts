"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithMicrosoft(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") ?? "/mes-demandes");
  const safePath =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/mes-demandes";

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safePath)}`,
      scopes: "email openid profile",
    },
  });

  if (error || !data.url) {
    redirect(
      `/login?error=${encodeURIComponent(
        error?.message ??
          "Connexion Microsoft indisponible. Activez le provider Azure dans Supabase."
      )}&redirectTo=${encodeURIComponent(safePath)}`
    );
  }

  redirect(data.url);
}
