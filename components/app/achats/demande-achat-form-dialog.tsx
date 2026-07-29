"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

import { createDemandeAchat, updateDemandeAchat, genererNumeroDemandeAchat } from "@/app/(app)/achats/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  numero_demande: z.string().min(1, "Numéro requis"),
  materiel_description: z.string().min(1, "Description requise"),
  type_materiel: z.string().optional(),
  quantite: z.string().optional(),
  prix_unitaire: z.string().optional(),
  montant_total: z.string().optional(),
  fournisseur: z.string().optional(),
  devis_url: z.string().optional(),
  justification: z.string().optional(),
  statut: z.string().optional(),
  priorite: z.string().optional(),
  demandeur: z.string().optional(),
  approbateur: z.string().optional(),
  date_demande: z.string().min(1, "Date requise"),
  date_approbation: z.string().optional(),
  date_decaissement: z.string().optional(),
  date_reception: z.string().optional(),
  date_mise_production: z.string().optional(),
  materiel_id: z.string().optional(),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function DemandeAchatFormDialog({
  mode = "create",
  initialValues,
}: {
  mode?: "create" | "edit";
  initialValues?: Partial<Values> & { id: string };
}) {
  const [open, setOpen] = React.useState(false);
  const [uploadingDevis, setUploadingDevis] = React.useState(false);
  const [devisPreview, setDevisPreview] = React.useState<string | null>(null);
  const [loadingNumero, setLoadingNumero] = React.useState(false);

  // Vérifier si la demande est protégée (approuvée ou décaissée)
  const statutProtege = Boolean(
    mode === "edit" && 
    initialValues?.statut && 
    ["Approuvée", "Décaissée", "Réceptionnée", "En production"].includes(initialValues.statut)
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      statut: "En attente",
      priorite: "Normale",
      date_demande: new Date().toISOString().slice(0, 10),
      quantite: "1",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    if (mode !== "edit" || !initialValues) {
      // Mode création: générer un nouveau numéro automatiquement
      async function genererNumero() {
        try {
          setLoadingNumero(true);
          const numero = await genererNumeroDemandeAchat();
          form.reset({
            numero_demande: numero,
            statut: "En attente",
            priorite: "Normale",
            date_demande: new Date().toISOString().slice(0, 10),
            quantite: "1",
          });
        } catch (error) {
          toast.error("Erreur génération numéro");
          console.error(error);
        } finally {
          setLoadingNumero(false);
        }
      }
      genererNumero();
      setDevisPreview(null);
      return;
    }

    form.reset({
      numero_demande: initialValues.numero_demande ?? "",
      materiel_description: initialValues.materiel_description ?? "",
      type_materiel: initialValues.type_materiel ?? undefined,
      quantite: initialValues.quantite?.toString() ?? "1",
      prix_unitaire: initialValues.prix_unitaire ?? undefined,
      montant_total: initialValues.montant_total ?? undefined,
      fournisseur: initialValues.fournisseur ?? undefined,
      devis_url: initialValues.devis_url ?? undefined,
      justification: initialValues.justification ?? undefined,
      statut: initialValues.statut ?? "En attente",
      priorite: initialValues.priorite ?? "Normale",
      demandeur: initialValues.demandeur ?? undefined,
      approbateur: initialValues.approbateur ?? undefined,
      date_demande: initialValues.date_demande ?? "",
      date_approbation: initialValues.date_approbation ?? undefined,
      date_decaissement: initialValues.date_decaissement ?? undefined,
      date_reception: initialValues.date_reception ?? undefined,
      date_mise_production: initialValues.date_mise_production ?? undefined,
      materiel_id: initialValues.materiel_id ?? undefined,
      notes: initialValues.notes ?? undefined,
    });
    setDevisPreview(initialValues.devis_url ?? null);
  }, [open, mode, initialValues, form]);

  async function uploadDevis(file: File): Promise<string | null> {
    try {
      const supabase = createSupabaseBrowserClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("devis-achats")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("devis-achats").getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading devis:", error);
      return null;
    }
  }

  async function onSubmit(values: Values) {
    try {
      const data = {
        numero_demande: values.numero_demande,
        materiel_description: values.materiel_description,
        type_materiel: values.type_materiel,
        quantite: values.quantite ? Number(values.quantite) : undefined,
        prix_unitaire: values.prix_unitaire ? Number(values.prix_unitaire) : undefined,
        montant_total: values.montant_total ? Number(values.montant_total) : undefined,
        fournisseur: values.fournisseur,
        devis_url: values.devis_url,
        justification: values.justification,
        statut: values.statut,
        priorite: values.priorite,
        demandeur: values.demandeur,
        date_demande: values.date_demande,
        notes: values.notes,
      };

      if (mode === "edit") {
        if (!initialValues?.id) throw new Error("ID manquant");
        await updateDemandeAchat({
          id: initialValues.id,
          ...data,
          approbateur: values.approbateur,
          date_approbation: values.date_approbation,
          date_decaissement: values.date_decaissement,
          date_reception: values.date_reception,
          date_mise_production: values.date_mise_production,
          materiel_id: values.materiel_id,
        });
        toast.success("Demande modifiée");
      } else {
        await createDemandeAchat(data);
        toast.success("Demande créée");
        form.reset();
        setDevisPreview(null);
      }
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={mode === "edit" ? "outline" : "default"}
          size={mode === "edit" ? "sm" : "default"}
          disabled={statutProtege}
          title={statutProtege ? "Modification impossible: demande déjà approuvée ou décaissée" : undefined}
        >
          {mode === "edit" ? "Modifier" : "Nouvelle demande"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Modifier demande d'achat" : "Nouvelle demande d'achat"}
          </DialogTitle>
          <DialogDescription>
            {statutProtege ? (
              <span className="text-destructive font-medium">
                ⚠️ Modification impossible: cette demande a été approuvée ou décaissée.
              </span>
            ) : (
              "Workflow: Demande → Approbation → Décaissement → Réception → Mise en production"
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="numero_demande"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Demande*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="DA-2025-12-001" 
                        {...field} 
                        disabled={mode === "create" || loadingNumero}
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_demande"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date demande*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="materiel_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description matériel*</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Ex: Ordinateur portable Dell..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="type_materiel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Ordinateur portable" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fournisseur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom fournisseur" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="prix_unitaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix unitaire (FCFA)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="montant_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant total (FCFA)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="demandeur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Demandeur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom demandeur" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="En attente">En attente</SelectItem>
                        <SelectItem value="Approuvée">Approuvée</SelectItem>
                        <SelectItem value="Rejetée">Rejetée</SelectItem>
                        <SelectItem value="Décaissée">Décaissée</SelectItem>
                        <SelectItem value="Réceptionnée">Réceptionnée</SelectItem>
                        <SelectItem value="En production">En production</SelectItem>
                        <SelectItem value="Annulée">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priorite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Basse">Basse</SelectItem>
                        <SelectItem value="Normale">Normale</SelectItem>
                        <SelectItem value="Haute">Haute</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {mode === "edit" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date_approbation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date approbation</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_decaissement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date décaissement</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_reception"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date réception</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_mise_production"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date mise en production</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div>
              <FormLabel>Devis (PDF)</FormLabel>
              <div className="mt-2 flex flex-col gap-3">
                {devisPreview && (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <span className="text-sm flex-1">Devis attaché</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDevisPreview(null);
                        form.setValue("devis_url", undefined);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent w-fit">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">
                      {uploadingDevis ? "Upload en cours..." : "Choisir un fichier"}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    disabled={uploadingDevis}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        setUploadingDevis(true);
                        const url = await uploadDevis(file);
                        if (url) {
                          setDevisPreview(url);
                          form.setValue("devis_url", url);
                          toast.success("Devis uploadé");
                        } else {
                          toast.error("Erreur lors de l'upload");
                        }
                      } catch (error) {
                        toast.error("Erreur lors de l'upload");
                      } finally {
                        setUploadingDevis(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Raison de l'achat..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
