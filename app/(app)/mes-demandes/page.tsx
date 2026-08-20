import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ITSM_CATEGORIES, ITSM_ENTITES, ITSM_PRIORITES } from "@/lib/itsm/constants";
import { employeDisplayName } from "@/lib/utils/employe-matching";

import { createDemandeFromForm, listMesDemandes } from "./actions";

export default async function MesDemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await searchParams;
  const { tickets, employe, access } = await listMesDemandes().catch(() => {
    redirect("/login?redirectTo=/mes-demandes");
  });

  if (!access.canRequestTicket) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Mes demandes"
        description="Soumettez une demande au support IT et suivez son traitement."
      />

      {params.created ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          Votre demande a bien été envoyée. L&apos;équipe IT vous répondra dès que possible.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle demande</CardTitle>
          <CardDescription>
            {employe
              ? `Connecté en tant que ${employeDisplayName(employe.prenom, employe.nom)} · ${employe.departement}`
              : access.email
                ? `Compte : ${access.email}. Associez votre email à votre fiche collaborateur pour un suivi complet.`
                : "Décrivez votre besoin ci-dessous."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createDemandeFromForm} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie</Label>
              <select
                id="categorie"
                name="categorie"
                defaultValue="Général"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                required
              >
                {ITSM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priorite">Urgence</Label>
              <select
                id="priorite"
                name="priorite"
                defaultValue="Normal"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                {ITSM_PRIORITES.filter((p) => p !== "Non défini").map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="entite">Entité / site</Label>
              <select
                id="entite"
                name="entite"
                defaultValue="IAG"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                {ITSM_ENTITES.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description du besoin</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                required
                placeholder="Ex. Mon PC ne démarre plus, j’ai besoin d’un reset mot de passe Outlook…"
              />
            </div>

            {access.email ? (
              <input type="hidden" name="contact_email" value={access.email} />
            ) : null}

            <div className="sm:col-span-2">
              <Button type="submit">Envoyer ma demande</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
          <CardDescription>Vos dernières demandes de support</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Description</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    Aucune demande pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">
                      {t.date} {String(t.heure_creation).slice(0, 5)}
                    </TableCell>
                    <TableCell>{t.categorie}</TableCell>
                    <TableCell>
                      <Badge variant={t.en_retard ? "destructive" : "secondary"}>{t.statut}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[220px] truncate text-sm">
                      {t.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {access.isStaff ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/itsm/tickets/${t.id}`}>Détail</Link>
                        </Button>
                      ) : null}
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
