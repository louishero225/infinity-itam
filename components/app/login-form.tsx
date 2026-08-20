"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { signIn } from "@/app/login/actions";
import { signInWithMicrosoft } from "@/app/login/microsoft-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const oauthError = searchParams.get("error");
  const [error, setError] = React.useState<string | null>(
    oauthError === "oauth_failed"
      ? "Connexion Microsoft échouée. Vérifiez la config Azure dans Supabase."
      : oauthError
        ? decodeURIComponent(oauthError)
        : null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);
    formData.set("redirectTo", redirectTo);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
          INFINITY AFRICA GROUP
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Connexion</h1>
        <p className="mt-2 text-sm text-slate-500">
          Bienvenue sur votre espace Support IT &amp; parc informatique.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700">
            Identifiant
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="vous@entreprise.com"
            className="h-11 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-700">
            Mot de passe
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </Button>

        <p className="text-right text-xs text-slate-500">
          Mot de passe oublié ? Contactez l&apos;équipe IT.
        </p>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs font-medium tracking-wide text-slate-400 uppercase">
          <span className="bg-white px-3">ou</span>
        </div>
      </div>

      <form action={signInWithMicrosoft}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Button
          type="submit"
          variant="outline"
          className="h-11 w-full rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
        >
          <MicrosoftLogo className="size-4" />
          Continuer avec Microsoft
        </Button>
      </form>

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
        Collaborateurs : après connexion, ouvrez{" "}
        <span className="font-medium text-slate-700">Mes demandes</span> pour contacter le support.
      </p>
    </div>
  );
}
