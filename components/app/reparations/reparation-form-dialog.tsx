"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createReparation, updateReparation } from "@/app/(app)/reparations/actions";
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
  materiel_id: z.string().min(1, "Matériel requis"),
  date_debut: z.string().min(1, "Date début requise"),
  date_fin: z.string().optional(),
  type_intervention: z.enum([
    "Maintenance préventive",
    "Réparation",
    "Mise à niveau",
    "Diagnostic",
    "Autre",
  ]),
  description: z.string().min(1, "Description requise"),
  cout: z.string().optional(),
  prestataire: z.string().optional(),
  numero_ticket: z.string().optional(),
  statut: z.enum(["En attente", "En cours", "Terminée", "Annulée"]).optional(),
  priorite: z.enum(["Basse", "Normale", "Haute", "Urgente"]).optional(),
  pieces_changees: z.string().optional(),
  diagnostique: z.string().optional(),
  resolution: z.string().optional(),
});

type Values = z.infer<typeof schema>;

type MaterielOption = { id: string; code_materiel: string; type: string };

export function ReparationFormDialog({
  mode = "create",
  initialValues,
}: {
  mode?: "create" | "edit";
  initialValues?: Partial<Values> & { id: string };
}) {
  const [open, setOpen] = React.useState(false);
  const [materiels, setMateriels] = React.useState<MaterielOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      statut: "En cours",
      priorite: "Normale",
      date_debut: new Date().toISOString().slice(0, 10),
      type_intervention: "Réparation",
    },
  });

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function loadMateriels() {
      try {
        setLoading(true);
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("materiels")
          .select("id, code_materiel, type")
          .order("code_materiel")
          .returns<MaterielOption[]>();

        if (error) throw new Error(error.message);
        if (!cancelled) setMateriels(data ?? []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMateriels();
    return () => {
      cancelled = true;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    if (mode !== "edit" || !initialValues) {
      form.reset({
        statut: "En cours",
        priorite: "Normale",
        date_debut: new Date().toISOString().slice(0, 10),
        type_intervention: "Réparation",
      });
      return;
    }

    form.reset({
      materiel_id: initialValues.materiel_id ?? "",
      date_debut: initialValues.date_debut ?? "",
      date_fin: initialValues.date_fin ?? undefined,
      type_intervention: initialValues.type_intervention as any,
      description: initialValues.description ?? "",
      cout: initialValues.cout ?? undefined,
      prestataire: initialValues.prestataire ?? undefined,
      numero_ticket: initialValues.numero_ticket ?? undefined,
      statut: (initialValues.statut as any) ?? "En cours",
      priorite: (initialValues.priorite as any) ?? "Normale",
      pieces_changees: initialValues.pieces_changees ?? undefined,
      diagnostique: initialValues.diagnostique ?? undefined,
      resolution: initialValues.resolution ?? undefined,
    });
  }, [open, mode, initialValues, form]);

  async function onSubmit(values: Values) {
    try {
      if (mode === "edit") {
        if (!initialValues?.id) throw new Error("ID manquant");
        await updateReparation({
          id: initialValues.id,
          materiel_id: values.materiel_id,
          date_debut: values.date_debut,
          date_fin: values.date_fin,
          type_intervention: values.type_intervention,
          description: values.description,
          cout: values.cout ? Number(values.cout) : undefined,
          prestataire: values.prestataire,
          numero_ticket: values.numero_ticket,
          statut: values.statut,
          priorite: values.priorite,
          pieces_changees: values.pieces_changees,
          diagnostique: values.diagnostique,
          resolution: values.resolution,
        });
        toast.success("Réparation modifiée");
      } else {
        await createReparation({
          materiel_id: values.materiel_id,
          date_debut: values.date_debut,
          date_fin: values.date_fin,
          type_intervention: values.type_intervention,
          description: values.description,
          cout: values.cout ? Number(values.cout) : undefined,
          prestataire: values.prestataire,
          numero_ticket: values.numero_ticket,
          statut: values.statut,
          priorite: values.priorite,
          pieces_changees: values.pieces_changees,
          diagnostique: values.diagnostique,
          resolution: values.resolution,
        });
        toast.success("Réparation ajoutée");
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
          <DialogTitle>
            {mode === "edit" ? "Modifier réparation" : "Nouvelle réparation"}
          </DialogTitle>
          <DialogDescription>
            Créer un ticket de réparation ou intervention sur un matériel.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="materiel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matériel*</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un matériel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materiels.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.code_materiel} - {m.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type_intervention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type intervention*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Maintenance préventive">
                          Maintenance préventive
                        </SelectItem>
                        <SelectItem value="Réparation">Réparation</SelectItem>
                        <SelectItem value="Mise à niveau">Mise à niveau</SelectItem>
                        <SelectItem value="Diagnostic">Diagnostic</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                        <SelectItem value="En cours">En cours</SelectItem>
                        <SelectItem value="Terminée">Terminée</SelectItem>
                        <SelectItem value="Annulée">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numero_ticket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Ticket</FormLabel>
                    <FormControl>
                      <Input placeholder="TICKET-001" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="date_debut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date début*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date fin</FormLabel>
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

            <FormField
              control={form.control}
              name="prestataire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prestataire</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du prestataire" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Problème rencontré..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnostique"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnostique</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Analyse du problème..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pieces_changees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pièces changées</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Disque dur, RAM..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resolution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Résolution</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Actions effectuées..." {...field} />
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
