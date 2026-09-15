"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { upsertDemandeOrange, type DemandeOrangeRow } from "@/app/(app)/flotte/actions";
import {
  DEMANDE_ORANGE_LABELS,
  DEMANDE_ORANGE_STATUTS,
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

type Props = {
  initial?: DemandeOrangeRow;
  trigger?: React.ReactNode;
};

export function DemandeOrangeFormDialog({ initial, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    try {
      await upsertDemandeOrange({
        id: initial?.id,
        reference_orange: String(fd.get("reference_orange") ?? "") || null,
        statut: String(fd.get("statut") ?? "brouillon") as DemandeOrangeRow["statut"],
        quantite: Number(fd.get("quantite") ?? 1),
        motif: String(fd.get("motif") ?? "") || null,
        demandeur_interne: String(fd.get("demandeur_interne") ?? "") || null,
        date_demande: String(fd.get("date_demande") ?? ""),
        date_livraison_prevue: String(fd.get("date_livraison_prevue") ?? "") || null,
        date_livraison_effective: String(fd.get("date_livraison_effective") ?? "") || null,
        notes: String(fd.get("notes") ?? "") || null,
      });
      toast.success(initial ? "Demande mise à jour" : "Demande créée");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1">
            <Plus className="size-4" />
            Nouvelle demande Orange
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Modifier la demande Orange" : "Demander de nouveaux numéros"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date_demande">Date demande</Label>
              <Input
                id="date_demande"
                name="date_demande"
                type="date"
                defaultValue={initial?.date_demande ?? today}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantite">Quantité</Label>
              <Input
                id="quantite"
                name="quantite"
                type="number"
                min={1}
                defaultValue={initial?.quantite ?? 1}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              name="statut"
              defaultValue={initial?.statut ?? "brouillon"}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              {DEMANDE_ORANGE_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {DEMANDE_ORANGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reference_orange">Référence Orange</Label>
            <Input
              id="reference_orange"
              name="reference_orange"
              defaultValue={initial?.reference_orange ?? ""}
              placeholder="N° dossier / bon de commande"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demandeur_interne">Demandeur interne</Label>
            <Input
              id="demandeur_interne"
              name="demandeur_interne"
              defaultValue={initial?.demandeur_interne ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motif">Motif</Label>
            <Input id="motif" name="motif" defaultValue={initial?.motif ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date_livraison_prevue">Livraison prévue</Label>
              <Input
                id="date_livraison_prevue"
                name="date_livraison_prevue"
                type="date"
                defaultValue={initial?.date_livraison_prevue ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_livraison_effective">Livraison effective</Label>
              <Input
                id="date_livraison_effective"
                name="date_livraison_effective"
                type="date"
                defaultValue={initial?.date_livraison_effective ?? ""}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes ?? ""} />
          </div>
          <Button type="submit" disabled={pending}>
            {initial ? "Enregistrer" : "Créer la demande"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
