"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createAttribution } from "@/app/(app)/attributions/actions";
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
import { FicheRemiseMateriel } from "./fiche-remise-materiel";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

type MaterielOption = { id: string; code_materiel: string; type: string; marque: string | null; modele: string | null };
type EmployeOption = { id: string; prenom: string; nom: string; departement: string };

type FicheData = {
  attribution_id: string;
  numero_attribution?: string;
  date_attribution: string;
  code_materiel: string;
  type_materiel: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  etat_remise?: string;
  accessoires?: string;
  beneficiaire_nom: string;
  beneficiaire_prenom?: string;
  beneficiaire_departement?: string;
  beneficiaire_type: string;
};

const schema = z
  .object({
    materiel_id: z.string().min(1),
    beneficiaire_type: z.enum(["employe", "departement", "societe"]),
    employe_id: z.string().optional(),
    beneficiaire_label: z.string().optional(),
    date_attribution: z.string().min(1),
    commentaire: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.beneficiaire_type === "employe" && !values.employe_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["employe_id"],
        message: "Veuillez sélectionner un employé.",
      });
    }

    if (values.beneficiaire_type !== "employe" && !values.beneficiaire_label) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["beneficiaire_label"],
        message: "Veuillez renseigner le bénéficiaire.",
      });
    }
  });

type Values = z.infer<typeof schema>;

export function AttributionFormDialog({
  materiels,
  employes,
}: {
  materiels: MaterielOption[];
  employes: EmployeOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [showFiche, setShowFiche] = React.useState(false);
  const [ficheData, setFicheData] = React.useState<FicheData | null>(null);
  const [attributionId, setAttributionId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      beneficiaire_type: "employe",
      date_attribution: new Date().toISOString().slice(0, 10),
    },
  });

  const beneficiaireType = form.watch("beneficiaire_type");

  const materielOptions: ComboboxOption[] = React.useMemo(
    () =>
      materiels.map((m) => ({
        value: m.id,
        label: `${m.code_materiel} — ${m.type}${m.marque ? ` (${m.marque}${m.modele ? ` ${m.modele}` : ""})` : ""}`,
        searchTerms: `${m.code_materiel} ${m.type} ${m.marque || ""} ${m.modele || ""}`.toLowerCase(),
      })),
    [materiels]
  );

  const employeOptions: ComboboxOption[] = React.useMemo(
    () =>
      employes.map((e) => ({
        value: e.id,
        label: `${e.prenom} ${e.nom} — ${e.departement}`,
        searchTerms: `${e.prenom} ${e.nom} ${e.departement}`.toLowerCase(),
      })),
    [employes]
  );

  async function onSubmit(values: Values) {
    setIsSubmitting(true);
    try {
      const result = await createAttribution({
        materiel_id: values.materiel_id,
        beneficiaire_type: values.beneficiaire_type,
        employe_id: values.beneficiaire_type === "employe" ? values.employe_id || null : null,
        beneficiaire_label:
          values.beneficiaire_type !== "employe" ? values.beneficiaire_label || null : null,
        date_attribution: values.date_attribution,
        commentaire: values.commentaire || null,
      });

      toast.success("Attribution enregistrée");
      
      // Récupérer l'ID de l'attribution créée depuis le résultat
      if (result?.attribution_id) {
        setAttributionId(result.attribution_id);
        
        // Charger les données pour la fiche
        const response = await fetch(`/api/attributions/${result.attribution_id}/fiche`);
        if (response.ok) {
          const data = await response.json();
          setFicheData(data);
          setShowFiche(true);
        }
      }

      form.reset({
        beneficiaire_type: "employe",
        date_attribution: new Date().toISOString().slice(0, 10),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'attribution");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={materiels.length === 0}>Attribuer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attribuer un matériel</DialogTitle>
          <DialogDescription>Sélectionne un matériel en stock et un bénéficiaire.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="materiel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matériel</FormLabel>
                  <FormControl>
                    <Combobox
                      options={materielOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Choisir un matériel"
                      searchPlaceholder="Rechercher un matériel..."
                      emptyMessage="Aucun matériel trouvé."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="beneficiaire_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bénéficiaire</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employe">Employé</SelectItem>
                      <SelectItem value="departement">Département</SelectItem>
                      <SelectItem value="societe">Société</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {beneficiaireType === "employe" ? (
              <FormField
                control={form.control}
                name="employe_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employé</FormLabel>
                    <FormControl>
                      <Combobox
                        options={employeOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Choisir un employé"
                        searchPlaceholder="Rechercher un employé..."
                        emptyMessage="Aucun employé trouvé."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="beneficiaire_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {beneficiaireType === "societe" ? "Société" : "Département"}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={beneficiaireType === "societe" ? "Nom société" : "Ex: IT"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="date_attribution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'attribution</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Commentaire</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Attribution en cours..." : "Attribuer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Fiche de remise après attribution */}
    {showFiche && ficheData && (
      <Dialog open={showFiche} onOpenChange={setShowFiche}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche de Remise - Attribution validée</DialogTitle>
          </DialogHeader>
          <FicheRemiseMateriel data={ficheData!} />
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}
