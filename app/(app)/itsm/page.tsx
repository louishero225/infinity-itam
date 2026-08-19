import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/auth/roles";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { ItsmToolsPanel } from "@/components/app/itsm/itsm-tools-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ITSM_CANAUX,
  ITSM_CATEGORIES,
  ITSM_ENTITES,
  ITSM_PRIORITES,
  ITSM_STATUTS,
} from "@/lib/itsm/constants";
import { nowTimeStr, todayDateStr } from "@/lib/itsm/sla";

import {
  createTicketFromForm,
  getFaitsMarquantsToday,
  getItsmStats,
  listDemandeurs,
  listTickets,
} from "./actions";

export default async function ItsTmPage() {
  const access = await getAccess().catch(() => null);
  if (!access) redirect("/dashboard");

  const [tickets, stats, demandeurs, faits] = await Promise.all([
    listTickets().catch(() => []),
    getItsmStats().catch(() => ({ total: 0, ouverts: 0, enRetard: 0, resolus: 0 })),
    listDemandeurs().catch(() => []),
    getFaitsMarquantsToday().catch(() => ""),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ITSM — Support IT"
        description="Tickets, import ManageEngine, onboarding et faits marquants — même Supabase que l'ITAM."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total tickets" value={stats.total} hint="tous statuts" />
        <StatCard
          label="Ouverts / en cours"
          value={stats.ouverts}
          hint="à traiter"
          accent={stats.ouverts > 0 ? "warning" : "success"}
        />
        <StatCard
          label="En retard SLA"
          value={stats.enRetard}
          hint="> 30 jours ou ManageEngine"
          accent={stats.enRetard > 0 ? "danger" : "success"}
        />
        <StatCard label="Résolus / fermés" value={stats.resolus} hint="clôturés" accent="muted" />
      </div>

      <ItsmToolsPanel canWrite={access.canWrite} initialFaits={faits} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouveau ticket</CardTitle>
          <CardDescription>Saisie manuelle — retard calculé automatiquement après 30 jours.</CardDescription>
        </CardHeader>
        <CardContent>
          {!access.canWrite ? (
            <p className="text-muted-foreground text-sm">Lecture seule.</p>
          ) : (
            <form action={createTicketFromForm} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={todayDateStr()} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heure_creation">Heure</Label>
                <Input
                  id="heure_creation"
                  name="heure_creation"
                  type="time"
                  defaultValue={nowTimeStr()}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="demandeur">Demandeur</Label>
                <Input
                  id="demandeur"
                  name="demandeur"
                  list="demandeurs-list"
                  placeholder="Nom du demandeur"
                  required
                />
                <datalist id="demandeurs-list">
                  {demandeurs.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entite">Entité</Label>
                <select
                  id="entite"
                  name="entite"
                  defaultValue="IAG"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ITSM_ENTITES.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categorie">Catégorie</Label>
                <select
                  id="categorie"
                  name="categorie"
                  defaultValue="Non catégorisé"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ITSM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canal">Canal</Label>
                <select
                  id="canal"
                  name="canal"
                  defaultValue="Verbal"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ITSM_CANAUX.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket_ref">N° ticket (optionnel)</Label>
                <Input id="ticket_ref" name="ticket_ref" placeholder="Request ID ManageEngine" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priorite">Priorité</Label>
                <select
                  id="priorite"
                  name="priorite"
                  defaultValue="Non défini"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ITSM_PRIORITES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <select
                  id="statut"
                  name="statut"
                  defaultValue="Ouvert"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ITSM_STATUTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="resolved_at">Résolu le (optionnel)</Label>
                <Input id="resolved_at" name="resolved_at" type="datetime-local" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Ex. Remplacement souris, reset mot de passe…"
                />
              </div>

              <input type="hidden" name="sous_canal" value="" />

              <div className="md:col-span-2 flex gap-3">
                <Button type="submit">Créer le ticket</Button>
                <Badge variant="secondary" className="self-center">
                  SLA auto : 30 jours
                </Badge>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste des tickets</CardTitle>
          <CardDescription>200 derniers tickets.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Demandeur</TableHead>
                <TableHead>Entité</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Retard</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    Aucun ticket. Appliquez la migration 20260819_07 puis créez ou importez.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">
                      {t.date} {String(t.heure_creation).slice(0, 5)}
                    </TableCell>
                    <TableCell>{t.demandeur}</TableCell>
                    <TableCell className="text-muted-foreground">{t.entite || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{t.categorie}</TableCell>
                    <TableCell>{t.statut}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.source}</Badge>
                    </TableCell>
                    <TableCell>
                      {t.en_retard ? (
                        <Badge variant="destructive">Oui</Badge>
                      ) : (
                        <Badge variant="secondary">Non</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/itsm/tickets/${t.id}`}>Ouvrir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
