"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { restituerAttribution } from "@/app/(app)/attributions/actions";
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
import { FicheReceptionMateriel } from "./fiche-reception-materiel";

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Restitution de matériel</DialogTitle>
            <DialogDescription>
              Vérifiez l'état du matériel avant de valider la restitution.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Contrôle de l'état du matériel</h3>
                <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                  <FormField
                    control={form.control}
                    name="appareil_complet"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Appareil complet et fonctionnel
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ecran_intact"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Écran intact sans rayures
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clavier_souris"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Clavier/Souris fonctionnels
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="boitier_intact"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Boîtier/Coque sans dommages
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cables_presents"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Câbles et chargeur présents
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accessoires_complets"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Accessoires complets
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="donnees_effacees"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Données effacées/formaté
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="aucun_logiciel"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Aucun logiciel personnel installé
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

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

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Décision du Service IT *</h3>
                <FormField
                  control={form.control}
                  name="decision_it"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                            <input
                              type="radio"
                              value="bon_etat"
                              checked={field.value === "bon_etat"}
                              onChange={() => field.onChange("bon_etat")}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">Matériel accepté - Bon état (prêt pour réattribution)</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                            <input
                              type="radio"
                              value="avec_reserves"
                              checked={field.value === "avec_reserves"}
                              onChange={() => field.onChange("avec_reserves")}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">Accepté avec réserves (voir remarques ci-dessus)</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                            <input
                              type="radio"
                              value="reparation"
                              checked={field.value === "reparation"}
                              onChange={() => field.onChange("reparation")}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">Nécessite réparation avant réattribution</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 border border-gray-200">
                            <input
                              type="radio"
                              value="reformer"
                              checked={field.value === "reformer"}
                              onChange={() => field.onChange("reformer")}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">Matériel à réformer (hors service)</span>
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Restitution en cours..." : "Valider la restitution"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Fiche de réception après restitution */}
      {showFiche && ficheData && (
        <Dialog open={showFiche} onOpenChange={setShowFiche}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Fiche de Réception - Restitution validée</DialogTitle>
            </DialogHeader>
            <FicheReceptionMateriel data={ficheData} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
