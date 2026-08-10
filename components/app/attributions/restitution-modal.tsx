"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { restituerAttribution } from "@/app/(app)/attributions/actions";
import { FormDialogContent, FormSection } from "@/components/app/form-dialog-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FicheReceptionMateriel } from "./fiche-reception-materiel";

const DECISION_OPTIONS = [
  {
    value: "bon_etat",
    label: "Matériel accepté — Bon état (prêt pour réattribution)",
  },
  {
    value: "avec_reserves",
    label: "Accepté avec réserves (voir remarques ci-dessus)",
  },
  {
    value: "reparation",
    label: "Nécessite réparation avant réattribution",
  },
  {
    value: "reformer",
    label: "Matériel à réformer (hors service)",
  },
] as const;

const CHECKLIST_FIELDS = [
  { name: "appareil_complet" as const, label: "Appareil complet et fonctionnel" },
  { name: "ecran_intact" as const, label: "Écran intact sans rayures" },
  { name: "clavier_souris" as const, label: "Clavier/Souris fonctionnels" },
  { name: "boitier_intact" as const, label: "Boîtier/Coque sans dommages" },
  { name: "cables_presents" as const, label: "Câbles et chargeur présents" },
  { name: "accessoires_complets" as const, label: "Accessoires complets" },
  { name: "donnees_effacees" as const, label: "Données effacées/formaté" },
  { name: "aucun_logiciel" as const, label: "Aucun logiciel personnel installé" },
];

const schema = z.object({
  etat_restitution: z.string().min(1, "Veuillez sélectionner un état"),
  commentaire: z.string().optional(),
  decision_it: z.enum(["bon_etat", "avec_reserves", "reparation", "reformer"], {
    message: "Veuillez sélectionner une décision",
  }),
  appareil_complet: z.boolean(),
  ecran_intact: z.boolean(),
  clavier_souris: z.boolean(),
  boitier_intact: z.boolean(),
  cables_presents: z.boolean(),
  accessoires_complets: z.boolean(),
  donnees_effacees: z.boolean(),
  aucun_logiciel: z.boolean(),
});

type Values = z.infer<typeof schema>;

type FicheData = {
  attribution_id: string;
  numero_attribution?: string;
  date_attribution: string;
  date_restitution?: string;
  code_materiel: string;
  type_materiel: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  etat_restitution?: string;
  commentaire?: string;
  beneficiaire_nom: string;
  beneficiaire_prenom?: string;
  beneficiaire_departement?: string;
  beneficiaire_type: string;
  checklist_items?: string[];
  decision_it?: "bon_etat" | "avec_reserves" | "reparation" | "reformer";
};

export function RestitutionModal({
  attributionId,
  materielId,
}: {
  attributionId: string;
  materielId: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [showFiche, setShowFiche] = React.useState(false);
  const [ficheData, setFicheData] = React.useState<FicheData | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      etat_restitution: "",
      commentaire: "",
      decision_it: undefined,
      appareil_complet: false,
      ecran_intact: false,
      clavier_souris: false,
      boitier_intact: false,
      cables_presents: false,
      accessoires_complets: false,
      donnees_effacees: false,
      aucun_logiciel: false,
    },
  });

  const allChecked = [
    form.watch("appareil_complet"),
    form.watch("ecran_intact"),
    form.watch("clavier_souris"),
    form.watch("boitier_intact"),
    form.watch("cables_presents"),
    form.watch("accessoires_complets"),
    form.watch("donnees_effacees"),
    form.watch("aucun_logiciel"),
  ].every(Boolean);

  React.useEffect(() => {
    if (allChecked) {
      form.setValue("etat_restitution", "Bon état");
    }
  }, [allChecked, form]);

  async function onSubmit(values: Values) {
    setIsSubmitting(true);
    try {
      await restituerAttribution({
        attribution_id: attributionId,
        materiel_id: materielId,
        etat_restitution: values.etat_restitution,
        commentaire: values.commentaire || null,
      });

      // Charger les données pour la fiche
      const response = await fetch(`/api/attributions/${attributionId}/fiche`);
      if (response.ok) {
        const data = await response.json();
        
        // Préparer la liste des items cochés
        const itemsCoches = [];
        if (values.appareil_complet) itemsCoches.push("Appareil complet et fonctionnel");
        if (values.ecran_intact) itemsCoches.push("Écran intact sans rayures");
        if (values.clavier_souris) itemsCoches.push("Clavier/Souris fonctionnels");
        if (values.boitier_intact) itemsCoches.push("Boîtier/Coque sans dommages");
        if (values.cables_presents) itemsCoches.push("Câbles et chargeur présents");
        if (values.accessoires_complets) itemsCoches.push("Accessoires complets");
        if (values.donnees_effacees) itemsCoches.push("Données effacées/formaté");
        if (values.aucun_logiciel) itemsCoches.push("Aucun logiciel personnel installé");
        
        setFicheData({
          ...data,
          etat_restitution: values.etat_restitution,
          commentaire: values.commentaire,
          date_restitution: new Date().toISOString().split("T")[0],
          checklist_items: itemsCoches,
          decision_it: values.decision_it,
        });
      }

      toast.success("Restitution enregistrée - Fiche de réception disponible");
      form.reset();
      setOpen(false);
      
      // Attendre un court instant avant d'ouvrir la fiche pour éviter les conflits de dialogs
      setTimeout(() => {
        setShowFiche(true);
      }, 300);
      
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la restitution");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Restituer
          </Button>
        </DialogTrigger>
        <FormDialogContent size="md">
          <DialogHeader>
            <DialogTitle>Restitution de matériel</DialogTitle>
            <DialogDescription>
              Vérifiez l&apos;état du matériel avant de valider la restitution.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormSection title="Contrôle de l'état du matériel">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-4">
                  {CHECKLIST_FIELDS.map(({ name, label }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-xs font-normal cursor-pointer">
                            {label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </FormSection>

              <FormField
                control={form.control}
                name="etat_restitution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>État général constaté *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez l'état général du matériel..."
                        rows={3}
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
                    <FormLabel>Observations et remarques</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tout dommage, dysfonctionnement ou pièce manquante..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormSection title="Décision du Service IT *">
                <FormField
                  control={form.control}
                  name="decision_it"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="gap-2"
                        >
                          {DECISION_OPTIONS.map((option) => (
                            <div
                              key={option.value}
                              className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent/50"
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={`decision-${option.value}`}
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor={`decision-${option.value}`}
                                className="text-sm font-normal cursor-pointer leading-snug"
                              >
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Restitution en cours..." : "Valider la restitution"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </FormDialogContent>
      </Dialog>

      {/* Fiche de réception après restitution */}
      {showFiche && ficheData && (
        <Dialog open={showFiche} onOpenChange={setShowFiche}>
          <FormDialogContent size="xl">
            <DialogHeader>
              <DialogTitle>Fiche de Réception - Restitution validée</DialogTitle>
            </DialogHeader>
            <FicheReceptionMateriel data={ficheData} />
          </FormDialogContent>
        </Dialog>
      )}
    </>
  );
}
