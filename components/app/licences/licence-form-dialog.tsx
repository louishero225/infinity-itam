"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createLicence, updateLicence } from "@/app/(app)/licences/actions";
import { getEmployes } from "@/app/(app)/employes/actions";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
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
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  nom: z.string().min(1, "Nom requis"),
  editeur: z.string().optional(),
  type_licence: z
    .enum(["Perpétuelle", "Abonnement", "Volume", "OEM", "Autre"])
    .optional(),
  gestionnaire_id: z.string().optional(),
  numero_licence: z.string().optional(),
  cle_produit: z.string().optional(),
  date_achat: z.string().optional(),
  date_expiration: z.string().optional(),
  cout: z.string().optional(),
  nombre_postes: z.string().optional(),
  postes_utilises: z.string().optional(),
  contact_support: z.string().optional(),
  url_telechargement: z.string().optional(),
  notes: z.string().optional(),
  statut: z.enum(["Active", "Expirée", "En attente", "Résiliée"]).optional(),
  is_active: z.boolean().optional(),
});

type Values = z.infer<typeof schema>;

export function LicenceFormDialog({
  mode = "create",
  initialValues,
}: {
  mode?: "create" | "edit";
  initialValues?: Partial<Values> & { id: string };
}) {
  const [open, setOpen] = React.useState(false);
  const [employes, setEmployes] = React.useState<Array<{ id: string; prenom: string; nom: string; departement: string | null }>>([]);

  React.useEffect(() => {
    getEmployes().then(setEmployes);
  }, []);

  const employeOptions: ComboboxOption[] = React.useMemo(
    () =>
      employes.map((e) => ({
        value: e.id,
        label: `${e.prenom} ${e.nom}${e.departement ? ` - ${e.departement}` : ""}`,
        searchTerms: `${e.prenom} ${e.nom} ${e.departement || ""}`,
      })),
    [employes]
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      statut: "Active",
      nombre_postes: "1",
      postes_utilises: "0",
      is_active: true,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    if (mode !== "edit" || !initialValues) {
      form.reset({
        statut: "Active",
        nombre_postes: "1",
        postes_utilises: "0",
        is_active: true,
      });
      return;
    }

    form.reset({
      nom: initialValues.nom ?? "",
      editeur: initialValues.editeur ?? "",
      type_licence: initialValues.type_licence as any,
      gestionnaire_id: initialValues.gestionnaire_id ?? "",
      numero_licence: initialValues.numero_licence ?? "",
      cle_produit: initialValues.cle_produit ?? "",
      date_achat: initialValues.date_achat ?? "",
      date_expiration: initialValues.date_expiration ?? "",
      cout: initialValues.cout?.toString() ?? "",
      nombre_postes: initialValues.nombre_postes?.toString() ?? "1",
      postes_utilises: initialValues.postes_utilises?.toString() ?? "0",
      contact_support: initialValues.contact_support ?? "",
      url_telechargement: initialValues.url_telechargement ?? "",
      notes: initialValues.notes ?? "",
      statut: (initialValues.statut as any) ?? "Active",
      is_active: initialValues.is_active ?? true,
    });
  }, [open, mode, initialValues, form]);

  async function onSubmit(values: Values) {
    try {
      if (mode === "edit") {
        if (!initialValues?.id) throw new Error("ID manquant");
        await updateLicence({
          id: initialValues.id,
          nom: values.nom,
          editeur: values.editeur || undefined,
          type_licence: values.type_licence,
          gestionnaire_id: values.gestionnaire_id || undefined,
          numero_licence: values.numero_licence || undefined,
          cle_produit: values.cle_produit || undefined,
          date_achat: values.date_achat || undefined,
          date_expiration: values.date_expiration || undefined,
          cout: values.cout ? Number(values.cout) : undefined,
          nombre_postes: values.nombre_postes ? Number(values.nombre_postes) : undefined,
          postes_utilises: values.postes_utilises ? Number(values.postes_utilises) : undefined,
          contact_support: values.contact_support || undefined,
          url_telechargement: values.url_telechargement || undefined,
          notes: values.notes || undefined,
          statut: values.statut,
          is_active: values.is_active,
        });
        toast.success("Licence modifiée");
      } else {
        await createLicence({
          nom: values.nom,
          editeur: values.editeur || undefined,
          type_licence: values.type_licence,
          gestionnaire_id: values.gestionnaire_id || undefined,
          numero_licence: values.numero_licence || undefined,
          cle_produit: values.cle_produit || undefined,
          date_achat: values.date_achat || undefined,
          date_expiration: values.date_expiration || undefined,
          cout: values.cout ? Number(values.cout) : undefined,
          nombre_postes: values.nombre_postes ? Number(values.nombre_postes) : 1,
          postes_utilises: values.postes_utilises ? Number(values.postes_utilises) : 0,
          contact_support: values.contact_support || undefined,
          url_telechargement: values.url_telechargement || undefined,
          notes: values.notes || undefined,
          statut: values.statut ?? "Active",
          is_active: values.is_active ?? true,
        });
        toast.success("Licence ajoutée");
        form.reset();
      }
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "edit" ? "outline" : "default"} size={mode === "edit" ? "sm" : "default"}>
          {mode === "edit" ? "Modifier" : "Ajouter"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Modifier licence" : "Nouvelle licence"}</DialogTitle>
          <DialogDescription>
            Gérer les licences logicielles avec alertes de renouvellement automatiques.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom*</FormLabel>
                    <FormControl>
                      <Input placeholder="Microsoft Office 365" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="editeur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Éditeur</FormLabel>
                    <FormControl>
                      <Input placeholder="Microsoft" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type_licence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Perpétuelle">Perpétuelle</SelectItem>
                        <SelectItem value="Abonnement">Abonnement</SelectItem>
                        <SelectItem value="Volume">Volume</SelectItem>
                        <SelectItem value="OEM">OEM</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gestionnaire_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestionnaire abonnement</FormLabel>
                    <FormControl>
                      <Combobox
                        options={employeOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Sélectionner..."
                        searchPlaceholder="Rechercher employé..."
                        emptyMessage="Aucun employé trouvé"
                      />
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
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Expirée">Expirée</SelectItem>
                        <SelectItem value="En attente">En attente</SelectItem>
                        <SelectItem value="Résiliée">Résiliée</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Licence active</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Activer ou désactiver cette licence
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="numero_licence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Licence</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cle_produit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clé produit</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="date_achat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date achat</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_expiration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date expiration</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coût (FCFA)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre_postes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de postes</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postes_utilises"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postes utilisés</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contact_support"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact support</FormLabel>
                  <FormControl>
                    <Input placeholder="support@editeur.com" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url_telechargement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL téléchargement</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
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
                    <Textarea rows={3} {...field} />
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
