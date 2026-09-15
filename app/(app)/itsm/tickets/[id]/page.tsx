import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";

import { getStaffAccess } from "@/lib/auth/roles";
import { isResolutionAnomaly } from "@/lib/itsm/sla";
import { ITSM_PRIORITES, ITSM_STATUTS } from "@/lib/itsm/constants";
import {
  ItsmPrioriteBadge,
  ItsmSlaBadge,
  ItsmStatutBadge,
  ticketRefLabel,
} from "@/components/app/itsm/itsm-status";
import { ItsmSlaClock } from "@/components/app/itsm/itsm-sla-clock";
import { TicketDemandeurParcCard } from "@/components/app/itsm/ticket-demandeur-parc-card";
import { PiecesJointesCard } from "@/components/app/pieces-jointes-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  getTicketDetail,
  updateTicketFromForm,
} from "../../actions";
import { TicketConversationPanel } from "@/components/app/itsm/ticket-conversation-panel";
import { DEFAULT_TECHNICIAN } from "@/lib/itsm/constants";

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await getStaffAccess();

  const { id } = await params;
  const detail = await getTicketDetail(id);
  if (!detail) redirect("/itsm");

  const { ticket, comments, pieces, history, demandeurParc } = detail;
  const canWrite = access.canWrite;
  const ref = ticketRefLabel(ticket);
  const resolutionAnomaly = isResolutionAnomaly({
    date: ticket.date,
    heure_creation: ticket.heure_creation,
    resolved_at: ticket.resolved_at,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Barre ticket — style Jira / Freshservice */}
      <div className="sticky top-0 z-10 -mx-1 rounded-xl border bg-card/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
              <Link href="/itsm" aria-label="Retour à la file">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold tracking-wide text-sky-700 dark:text-sky-300">
                  {ref}
                </span>
                <ItsmStatutBadge statut={ticket.statut} />
                <ItsmPrioriteBadge priorite={ticket.priorite} />
                <ItsmSlaBadge enRetard={ticket.en_retard} />
              </div>
              <h1 className="mt-1 truncate text-lg font-semibold tracking-tight">
                {ticket.categorie}
                <span className="text-muted-foreground font-normal"> · {ticket.demandeur}</span>
              </h1>
              <p className="text-muted-foreground text-xs">
                {ticket.date} {String(ticket.heure_creation).slice(0, 5)} · {ticket.canal} ·{" "}
                {ticket.source}
                {resolutionAnomaly ? " · Clôture probablement groupée" : ""}
              </p>
            </div>
          </div>
          {pieces.length > 0 ? (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <Paperclip className="size-3.5" />
              {pieces.length} pièce(s)
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Colonne principale : description + conversation */}
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Demande</h2>
            </div>
            <div className="space-y-3 px-4 py-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {ticket.description?.trim() || "Aucune description fournie."}
              </p>
              <dl className="grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs">Entité</dt>
                  <dd className="font-medium">{ticket.entite || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Technicien</dt>
                  <dd className="font-medium">{ticket.technicien || "Non assigné"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Priorité / SLA</dt>
                  <dd className="font-medium">
                    {ticket.priorite} · High 3 j · Medium 7 j · Normal 14 j
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Conversation</h2>
              <span className="text-muted-foreground text-xs tabular-nums">
                {comments.length} message(s)
              </span>
            </div>
            <div className="space-y-0 divide-y">
              {comments.length === 0 ? (
                <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                  Aucun commentaire — démarrez le fil ici.
                </p>
              ) : (
                comments.map((c) => (
                  <article
                    key={c.id}
                    className={
                      c.is_internal
                        ? "border-l-2 border-l-amber-400 bg-amber-50/40 px-4 py-3 dark:border-l-amber-600 dark:bg-amber-950/20"
                        : "px-4 py-3"
                    }
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{c.created_by_email ?? "Agent"}</p>
                        {c.is_internal ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                            Interne
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                            Public
                          </span>
                        )}
                      </div>
                      <time className="text-muted-foreground text-[11px] tabular-nums">
                        {new Date(c.created_at).toLocaleString("fr-FR")}
                      </time>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">{c.contenu}</p>
                  </article>
                ))
              )}
            </div>
            {canWrite ? (
              <TicketConversationPanel
                ticketId={ticket.id}
                canWrite={canWrite}
                agentLabel={DEFAULT_TECHNICIAN}
                currentTechnicien={ticket.technicien || ""}
              />
            ) : null}
          </section>

          <PiecesJointesCard entityType="itsm_ticket" entityId={ticket.id} pieces={pieces} />
        </div>

        {/* Panneau propriétés — style Zendesk/Jira */}
        <aside className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
          <ItsmSlaClock
            date={ticket.date}
            heure_creation={ticket.heure_creation}
            resolved_at={ticket.resolved_at}
            statut={ticket.statut}
            priorite={ticket.priorite}
          />

          <section className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Propriétés</h2>
            </div>
            <div className="px-4 py-3">
              {canWrite ? (
                <form action={updateTicketFromForm} className="space-y-3">
                  <input type="hidden" name="ticket_id" value={ticket.id} />
                  <div className="space-y-1.5">
                    <Label htmlFor="statut" className="text-xs">
                      Statut
                    </Label>
                    <select
                      id="statut"
                      name="statut"
                      defaultValue={ticket.statut}
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    >
                      {ITSM_STATUTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="priorite" className="text-xs">
                      Priorité
                    </Label>
                    <select
                      id="priorite"
                      name="priorite"
                      defaultValue={ticket.priorite}
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    >
                      {ITSM_PRIORITES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="technicien" className="text-xs">
                      Agent assigné
                    </Label>
                    <Input
                      id="technicien"
                      name="technicien"
                      defaultValue={ticket.technicien || ""}
                      placeholder="Nom de l'agent"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="resolved_at" className="text-xs">
                      Résolu le
                    </Label>
                    <Input
                      id="resolved_at"
                      name="resolved_at"
                      type="datetime-local"
                      defaultValue={toDatetimeLocalValue(ticket.resolved_at)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs">
                      Description (édition)
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={ticket.description ?? ""}
                      className="resize-none text-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full" size="sm">
                    Enregistrer
                  </Button>
                </form>
              ) : (
                <p className="text-muted-foreground text-sm">Lecture seule.</p>
              )}
            </div>
          </section>

          <TicketDemandeurParcCard demandeurLabel={ticket.demandeur} context={demandeurParc} />

          <section className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Activité</h2>
            </div>
            <div className="max-h-72 space-y-0 overflow-y-auto divide-y">
              {history.length === 0 ? (
                <p className="text-muted-foreground px-4 py-6 text-center text-xs">
                  Aucune action journalisée.
                </p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="px-4 py-2.5">
                    <p className="text-xs font-medium">{h.action}</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      {h.user_email ?? "—"} · {new Date(h.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
