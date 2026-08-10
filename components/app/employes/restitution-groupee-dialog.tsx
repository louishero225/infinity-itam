"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";

import { createRestitutionGroupee } from "@/app/(app)/attributions/restitution-groupee-actions";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const schema = z.object({
  date_restitution: z.string().min(1, "La date est requise"),
  commentaire: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function RestitutionGroupeeDialog({
  employeId,
  employeNom,
  nombreMateriels,
}: {
  employeId: string;
  employeNom: string;
  nombreMateriels: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      date_restitution: new Date().toISOString().split("T")[0],
      commentaire: "",
    },
  });

  async function onSubmit() {
    setShowConfirm(true);
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    setShowConfirm(false);

    try {
      const values = form.getValues();
      const result = await createRestitutionGroupee({
        employe_id: employeId,
        date_restitution: values.date_restitution,
        commentaire: values.commentaire || null,
      });

      toast.success(`${result.count} matériel(s) restitué(s) avec succès`);

      // Ouvrir la fiche de restitution groupée
      window.open(
        `/api/attributions/restitution-groupee/${employeId}?date=${encodeURIComponent(values.date_restitution)}`,
        "_blank"
      );

      form.reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la restitution groupée");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (nombreMateriels === 0) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <UserX className="h-4 w-4 mr-2" />
            Restitution Groupée ({nombreMateriels})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restitution Groupée - Départ Employé</DialogTitle>
            <DialogDescription>
              Restituer tous les matériels de {employeNom} en une seule opération
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800">
                  <strong>{nombreMateriels} matériel(s)</strong> sera(ont) restitué(s) simultanément.
                  Cette action est irréversible.
                </p>
              </div>

              <FormField
                control={form.control}
                name="date_restitution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de restitution *</FormLabel>
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
                        placeholder="Ex: Départ de l'employé, fin de contrat..."
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
                <Button type="submit" variant="destructive" disabled={isSubmitting}>
                  Confirmer la restitution
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la restitution groupée ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de restituer <strong>{nombreMateriels} matériel(s)</strong> de{" "}
              <strong>{employeNom}</strong>.
              <br />
              <br />
              Tous les matériels seront marqués comme restitués et redeviendront disponibles.
              <br />
              <br />
              Cette action est <strong>irréversible</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
