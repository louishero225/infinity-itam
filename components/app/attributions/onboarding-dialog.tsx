"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createOnboardingAttribution } from "@/app/(app)/attributions/actions";
import { FormDialogContent } from "@/components/app/form-dialog-content";
import { FicheRemiseGroupee } from "@/components/app/attributions/fiche-remise-groupee";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PackagePlus, Search } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

const schema = z.object({
  employe_id: z.string().min(1, "Veuillez sélectionner un employé"),
  materiel_ids: z.array(z.string()).min(1, "Sélectionnez au moins un matériel"),
  date_attribution: z.string().min(1, "La date est requise"),
  commentaire: z.string().optional(),
});

type Values = z.infer<typeof schema>;

type EmployeOption = { id: string; prenom: string; nom: string; departement: string };
type MaterielOption = {
  id: string;
  code_materiel: string;
  type: string;
  marque: string | null;
  modele: string | null;
};

type FicheGroupeeData = React.ComponentProps<typeof FicheRemiseGroupee>["data"];

export function OnboardingDialog({
  employes,
  materiels,
}: {
  employes: EmployeOption[];
  materiels: MaterielOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [showFiche, setShowFiche] = React.useState(false);
  const [ficheData, setFicheData] = React.useState<FicheGroupeeData | null>(null);
  const [materielSearch, setMaterielSearch] = React.useState("");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      employe_id: "",
      materiel_ids: [],
      date_attribution: new Date().toISOString().split("T")[0],
      commentaire: "",
    },
  });

  const selectedMaterielIds = useWatch({ control: form.control, name: "materiel_ids" }) || [];

  const filteredMateriels = React.useMemo(() => {
    if (!materielSearch) return materiels;
    const search = materielSearch.toLowerCase();
    return materiels.filter(
      (m) =>
        m.code_materiel.toLowerCase().includes(search) ||
        m.type.toLowerCase().includes(search) ||
        m.marque?.toLowerCase().includes(search) ||
        m.modele?.toLowerCase().includes(search)
    );
  }, [materiels, materielSearch]);

  async function onSubmit(values: Values) {
    try {
      const result = await createOnboardingAttribution({
        employe_id: values.employe_id,
        materiel_ids: values.materiel_ids,
        date_attribution: values.date_attribution,
        commentaire: values.commentaire || null,
      });

      toast.success(`${result.count} attribution(s) créée(s) avec succès`);

      const idsParam = encodeURIComponent(result.attribution_ids.join(","));
      const ficheResponse = await fetch(
        `/api/attributions/groupee/${values.employe_id}?ids=${idsParam}`
      );

      if (ficheResponse.ok) {
        const data = (await ficheResponse.json()) as FicheGroupeeData;
        setFicheData(data);
        setShowFiche(true);
        window.open(
          `/api/attributions/groupee/${values.employe_id}/fiche?ids=${idsParam}`,
          "_blank"
        );
      } else {
        toast.error("Attributions créées, mais la fiche d'onboarding n'a pas pu être générée.");
      }

      form.reset();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'attribution groupée");
    }
  }

  const toggleMateriel = (materielId: string) => {
    const current = form.getValues("materiel_ids") || [];
    const updated = current.includes(materielId)
      ? current.filter((id) => id !== materielId)
      : [...current, materielId];
    form.setValue("materiel_ids", updated);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <PackagePlus className="h-4 w-4 mr-2" />
            Attribution Groupée (Onboarding)
          </Button>
        </DialogTrigger>
        <FormDialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Attribution Groupée - Kit d&apos;Onboarding</DialogTitle>
            <DialogDescription>
              Attribuez plusieurs matériels à un employé et générez une fiche de remise groupée
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="employe_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employé bénéficiaire *</FormLabel>
                    <FormControl>
                      <Combobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Rechercher un employé..."
                        emptyMessage="Aucun employé trouvé"
                        options={employes.map((e) => ({
                          value: e.id,
                          label: `${e.prenom} ${e.nom} - ${e.departement}`,
                          searchableText: `${e.prenom} ${e.nom} ${e.departement}`.toLowerCase(),
                        }))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materiel_ids"
                render={() => (
                  <FormItem>
                    <FormLabel>Matériels à attribuer * (sélection multiple)</FormLabel>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Rechercher un matériel..."
                        value={materielSearch}
                        onChange={(e) => setMaterielSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="border rounded-md p-4 space-y-2 max-h-64 overflow-y-auto">
                      {filteredMateriels.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {materielSearch ? "Aucun matériel trouvé" : "Aucun matériel disponible"}
                        </p>
                      ) : (
                        filteredMateriels.map((materiel) => (
                          <label
                            key={materiel.id}
                            className="flex items-center space-x-3 p-2 hover:bg-accent/50 rounded cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedMaterielIds.includes(materiel.id)}
                              onCheckedChange={() => toggleMateriel(materiel.id)}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {materiel.code_materiel} - {materiel.type}
                              </div>
                              {(materiel.marque || materiel.modele) && (
                                <div className="text-xs text-muted-foreground">
                                  {materiel.marque} {materiel.modele}
                                </div>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedMaterielIds.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedMaterielIds.length} matériel(s) sélectionné(s)
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_attribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d&apos;attribution *</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commentaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commentaire (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Remarques particulières..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Créer les attributions
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </FormDialogContent>
      </Dialog>

      {showFiche && ficheData ? (
        <Dialog open={showFiche} onOpenChange={setShowFiche}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Fiche de remise — kit d&apos;onboarding</DialogTitle>
              <DialogDescription>
                Attribution groupée validée. Imprimez la fiche pour signature.
              </DialogDescription>
            </DialogHeader>
            <FicheRemiseGroupee data={ficheData} />
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
