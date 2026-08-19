import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/auth/roles";
import { isResolutionAnomaly } from "@/lib/itsm/sla";
import { ITSM_PRIORITES, ITSM_STATUTS } from "@/lib/itsm/constants";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { PiecesJointesCard } from "@/components/app/pieces-jointes-card";
import {
  addTicketCommentFromForm,
  getTicketDetail,
  updateTicketFromForm,
} from "../../actions";

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await getAccess().catch(() => null);
  if (!access) redirect("/dashboard");

  const { id } = await params;
  const detail = await getTicketDetail(id);
  if (!detail) redirect("/itsm");

  const { ticket, comments, pieces, history } = detail;
  const canWrite = access.canWrite;
  const resolutionAnomaly = isResolutionAnomaly({
    date: ticket.date,
    heure_creation: ticket.heure_creation,
    resolved_at: ticket.resolved_at,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ticket ITSM"
        description={`${ticket.demandeur} · ${ticket.categorie} · ${ticket.statut}`}
      />

      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/itsm">← Retour à la liste</Link>
      </Button>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Détails
              {ticket.en_retard ? (
                <Badge variant="destructive">En retard</Badge>
              ) : (
                <Badge variant="secondary">OK SLA</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {ticket.date} {String(ticket.heure_creation).slice(0, 5)} · Canal {ticket.canal} ·{" "}
              Source {ticket.source}
              {resolutionAnomaly ? " · Clôture probablement groupée (> 30 j)" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Entité</Label>
                <p className="text-sm mt-1">{ticket.entite}</p>
              </div>
              <div>
                <Label>Priorité</Label>
                <p className="text-sm mt-1">{ticket.priorite}</p>
              </div>
              <div>
                <Label>Technicien</Label>
                <p className="text-sm mt-1">{ticket.technicien}</p>
              </div>
              <div>
                <Label>Référence</Label>
                <p className="text-sm mt-1">{ticket.ticket_ref ?? "—"}</p>
              </div>
            </div>

            {ticket.description ? (
              <div className="space-y-1">
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">{ticket.description}</p>
              </div>
            ) : null}

            {canWrite ? (
              <form action={updateTicketFromForm}>
                <input type="hidden" name="ticket_id" value={ticket.id} />
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="statut">Statut</Label>
                      <select
                        id="statut"
                        name="statut"
                        defaultValue={ticket.statut}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {ITSM_STATUTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priorite">Priorité</Label>
                      <select
                        id="priorite"
                        name="priorite"
                        defaultValue={ticket.priorite}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {ITSM_PRIORITES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resolved_at">Résolu le (optionnel)</Label>
                    <Input
                      id="resolved_at"
                      name="resolved_at"
                      type="datetime-local"
                      defaultValue={toDatetimeLocalValue(ticket.resolved_at)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      defaultValue={ticket.description ?? ""}
                    />
                  </div>

                  <Button type="submit">Mettre à jour</Button>
                </div>
              </form>
            ) : (
              <p className="text-muted-foreground text-sm">Lecture seule.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commentaires</CardTitle>
            <CardDescription>{comments.length} commentaire(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun commentaire.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{c.created_by_email ?? "—"}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(c.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{c.contenu}</p>
                  </div>
                ))}
              </div>
            )}

            {canWrite ? (
              <form action={addTicketCommentFromForm} className="space-y-2">
                <input type="hidden" name="ticket_id" value={ticket.id} />
                <Label htmlFor="contenu">Ajouter un commentaire</Label>
                <Textarea id="contenu" name="contenu" rows={4} placeholder="Votre commentaire..." />
                <Button type="submit">Envoyer</Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PiecesJointesCard entityType="itsm_ticket" entityId={ticket.id} pieces={pieces} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
            <CardDescription>Dernières actions enregistrées dans le journal d’audit.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune action pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{h.user_email ?? "—"}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(h.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <p className="text-sm mt-2">{h.action}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

