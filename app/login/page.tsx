import { Suspense } from "react";
import { Headset, ShieldCheck, Ticket } from "lucide-react";

import { LoginForm } from "@/components/app/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 30%, rgb(56 189 248 / 0.25), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 20%, rgb(99 102 241 / 0.22), transparent 50%), radial-gradient(ellipse 60% 50% at 70% 90%, rgb(14 165 233 / 0.18), transparent 45%), linear-gradient(160deg, #0f172a 0%, #1e293b 45%, #312e81 100%)",
        }}
      />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-sm lg:min-h-[640px] lg:grid-cols-2">
        {/* Panneau gauche — marque */}
        <aside className="relative hidden flex-col justify-between p-8 text-white lg:flex lg:p-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.18) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide">
              <span className="flex size-6 items-center justify-center rounded-md bg-white text-[10px] font-bold text-slate-900">
                IT
              </span>
              INFINITY IT
            </div>
            <h2 className="mt-8 max-w-sm text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
              Support IT et gestion de parc, au même endroit.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-200/90">
              Tickets, demandes collaborateurs et inventaire matériel — une plateforme pour
              l&apos;équipe IT et les métiers.
            </p>
          </div>

          <div className="relative mt-10 space-y-4">
            <div className="rounded-2xl border border-white/15 bg-slate-900/55 p-5 shadow-lg backdrop-blur">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-sky-400/20 text-sky-200">
                  <Headset className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Équipe Support IT</p>
                  <p className="text-xs text-slate-300">Infinity Africa Group</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-100/95">
                « Un seul portail pour les demandes utilisateurs et le suivi du parc. Moins de
                mails, plus de clarté sur le SLA et les tickets ouverts. »
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Ticket className="size-3.5" /> Tickets &amp; SLA
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> Accès sécurisé
                </span>
              </div>
            </div>

            <div className="flex gap-1.5 px-1">
              <span className="h-1.5 w-6 rounded-full bg-sky-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
            </div>
          </div>
        </aside>

        {/* Panneau droit — formulaire */}
        <section className="bg-white lg:rounded-l-none">
          <div className="border-b border-slate-100 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                IT
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">INFINITY IT</p>
                <p className="text-xs text-slate-500">Support &amp; parc</p>
              </div>
            </div>
          </div>

          <Suspense
            fallback={
              <p className="p-10 text-center text-sm text-slate-500">Chargement…</p>
            }
          >
            <LoginForm />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
