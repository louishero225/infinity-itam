"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: "Identifiants invalides." };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { provisionCollaborateurOnFirstLogin } = await import(
        "@/lib/auth/provision-collaborateur"
      );
      await provisionCollaborateurOnFirstLogin({
        userId: user.id,
        email: user.email ?? null,
      });
    }
  } catch {
    return {
      error:
        "Impossible de joindre le serveur d'authentification. Vérifiez votre connexion puis réessayez.",
    };
  }

  redirect(safeRedirectPath(redirectTo));
}

function safeRedirectPath(path: string) {
  if (path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/dashboard";
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
