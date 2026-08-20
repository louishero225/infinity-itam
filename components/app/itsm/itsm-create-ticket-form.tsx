import {
  ITSM_CANAUX,
  ITSM_CATEGORIES,
  ITSM_ENTITES,
  ITSM_PRIORITES,
  ITSM_STATUTS,
} from "@/lib/itsm/constants";
import { nowTimeStr, todayDateStr } from "@/lib/itsm/sla";
import { employeDisplayName } from "@/lib/utils/employe-matching";
import { createTicketFromForm } from "@/app/(app)/itsm/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Employe = {
  id: string;
  prenom: string;
  nom: string;
  departement: string;
};

export function ItsmCreateTicketForm({
  canWrite,
  employes,
}: {
  canWrite: boolean;
  employes: Employe[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nouveau ticket</CardTitle>
        <CardDescription>
          Saisie manuelle — le retard SLA est calculé automatiquement après 30 jours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!canWrite ? (
          <p className="text-muted-foreground text-sm">Accès lecture seule.</p>
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
              <Label htmlFor="employe_id">Demandeur (collaborateur ITAM)</Label>
              <select
                id="employe_id"
                name="employe_id"
                defaultValue=""
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="">— Sélectionner un employé —</option>
                {employes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {employeDisplayName(e.prenom, e.nom)}
                    {e.departement ? ` · ${e.departement}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="demandeur">Ou saisie libre</Label>
              <Input id="demandeur" name="demandeur" placeholder="Nom si absent de la liste" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entite">Entité</Label>
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

            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie</Label>
              <select
                id="categorie"
                name="categorie"
                defaultValue="Non catégorisé"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
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
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
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
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
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
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
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

            <div className="flex gap-3 md:col-span-2">
              <Button type="submit">Créer le ticket</Button>
              <Badge variant="secondary" className="self-center">
                SLA auto : 30 jours
              </Badge>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
