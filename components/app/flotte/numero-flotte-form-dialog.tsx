"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { upsertNumeroFlotte, type NumeroFlotteRow } from "@/app/(app)/flotte/actions";
import {
  FLOTTE_FORMULES,
  FLOTTE_FORMULE_LABELS,
  FLOTTE_FORFAITS,
  FLOTTE_STATUTS,
  FLOTTE_STATUT_LABELS,
} from "@/lib/flotte/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { employeDisplayName } from "@/lib/utils/employe-matching";

type Props = {
  employes: { id: string; prenom: string; nom: string; departement: string }[];
  initial?: NumeroFlotteRow;
  trigger?: React.ReactNode;
};

export function NumeroFlotteFormDialog({ employes, initial, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [formule, setFormule] = React.useState(initial?.formule ?? "");

  React.useEffect(() => {
    if (open) setFormule(initial?.formule ?? "");
  }, [open, initial?.formule]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    try {
      const formuleValue = String(fd.get("formule") ?? "");
      await upsertNumeroFlotte({
        id: initial?.id,
        numero: String(fd.get("numero") ?? ""),
        statut: String(fd.get("statut") ?? "attribue") as NumeroFlotteRow["statut"],
        employe_id: String(fd.get("employe_id") ?? "") || null,
        titulaire_libre: String(fd.get("titulaire_libre") ?? "") || null,
        fonction: String(fd.get("fonction") ?? "") || null,
        departement: String(fd.get("departement") ?? "") || null,
        date_attribution: String(fd.get("date_attribution") ?? "") || null,
        formule:
          formuleValue === "mix_3" || formuleValue === "mix_5" ? formuleValue : null,
        notes: String(fd.get("notes") ?? "") || null,
      });
      toast.success(initial ? "Numéro mis à jour" : "Numéro ajouté");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1">
            <Plus className="size-4" />
            Ajouter un numéro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier le numéro" : "Nouveau numéro flotte"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="numero">Numéro</Label>
            <Input
              id="numero"
              name="numero"
              defaultValue={initial?.numero ?? ""}
              placeholder="07 00 00 00 00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              name="statut"
              defaultValue={initial?.statut ?? "attribue"}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              {FLOTTE_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {FLOTTE_STATUT_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employe_id">Collaborateur ITAM</Label>
            <select
              id="employe_id"
              name="employe_id"
              defaultValue={initial?.employe_id ?? ""}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              <option value="">— Aucun / saisie libre —</option>
              {employes.map((e) => (
                <option key={e.id} value={e.id}>
                  {employeDisplayName(e.prenom, e.nom)} · {e.departement}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="titulaire_libre">Titulaire (si hors ITAM)</Label>
            <Input
              id="titulaire_libre"
              name="titulaire_libre"
              defaultValue={initial?.titulaire_libre ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fonction">Fonction</Label>
              <Input id="fonction" name="fonction" defaultValue={initial?.fonction ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="departement">Département</Label>
              <Input id="departement" name="departement" defaultValue={initial?.departement ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="formule">Forfait mensuel</Label>
            <select
              id="formule"
              name="formule"
              value={formule}
              onChange={(e) => setFormule(e.target.value)}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              <option value="">— Non défini —</option>
              {FLOTTE_FORMULES.map((f) => (
                <option key={f} value={f}>
                  {FLOTTE_FORMULE_LABELS[f]} — {FLOTTE_FORFAITS[f].montant_ttc.toLocaleString("fr-FR")}{" "}
                  F TTC / mois
                </option>
              ))}
            </select>
            {formule === "mix_3" || formule === "mix_5" ? (
              <p className="text-muted-foreground text-xs">
                HT facture : {FLOTTE_FORFAITS[formule].montant_ht.toLocaleString("fr-FR")} F · TTC :{" "}
                {FLOTTE_FORFAITS[formule].montant_ttc.toLocaleString("fr-FR")} F
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date_attribution">Date attribution</Label>
            <Input
              id="date_attribution"
              name="date_attribution"
              type="date"
              defaultValue={initial?.date_attribution ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes ?? ""} />
          </div>
          <Button type="submit" disabled={pending}>
            {initial ? "Enregistrer" : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
