"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CreditCard, Check, X } from "lucide-react";

import {
  createPaiement,
  marquerPaiementEffectue,
  getPaiementsLicence,
  deletePaiement,
} from "@/app/(app)/licences/paiements-actions";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const paiementSchema = z.object({
  date_paiement_prevue: z.string().min(1, "Date requise"),
  montant_prevu: z.string().min(1, "Montant requis"),
  notes: z.string().optional(),
});

const validationSchema = z.object({
  date_paiement_effectuee: z.string().min(1, "Date requise"),
  montant_paye: z.string().min(1, "Montant requis"),
  mode_paiement: z.string().optional(),
  reference_paiement: z.string().optional(),
  notes: z.string().optional(),
});

type PaiementRow = {
  id: string;
  date_paiement_prevue: string;
  date_paiement_effectuee: string | null;
  montant_prevu: number;
  montant_paye: number | null;
  statut: string;
  mode_paiement: string | null;
  reference_paiement: string | null;
  notes: string | null;
};

export function PaiementsDialog({
  licenceId,
  licenceNom,
}: {
  licenceId: string;
  licenceNom: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [paiements, setPaiements] = React.useState<PaiementRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [validationPaiementId, setValidationPaiementId] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof paiementSchema>>({
    resolver: zodResolver(paiementSchema),
  });

  const validationForm = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
  });

  React.useEffect(() => {
    if (open) {
      loadPaiements();
    }
  }, [open]);

  async function loadPaiements() {
    try {
      setLoading(true);
      const data = await getPaiementsLicence(licenceId);
      setPaiements(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitPaiement(values: z.infer<typeof paiementSchema>) {
    try {
      await createPaiement({
        licence_id: licenceId,
        date_paiement_prevue: values.date_paiement_prevue,
        montant_prevu: Number(values.montant_prevu),
        notes: values.notes,
      });
      toast.success("Paiement ajouté");
      form.reset();
      setShowAddForm(false);
      loadPaiements();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function onSubmitValidation(values: z.infer<typeof validationSchema>) {
    if (!validationPaiementId) return;

    try {
      await marquerPaiementEffectue({
        paiement_id: validationPaiementId,
        date_paiement_effectuee: values.date_paiement_effectuee,
        montant_paye: Number(values.montant_paye),
        mode_paiement: values.mode_paiement,
        reference_paiement: values.reference_paiement,
        notes: values.notes,
      });
      toast.success("Paiement validé");
      validationForm.reset();
      setValidationPaiementId(null);
      loadPaiements();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "Payé":
        return <Badge className="bg-green-500">Payé</Badge>;
      case "En attente":
        return <Badge className="bg-blue-500">En attente</Badge>;
      case "En retard":
        return <Badge variant="destructive">En retard</Badge>;
      case "Annulé":
        return <Badge variant="secondary">Annulé</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CreditCard className="h-4 w-4 mr-1" />
          Paiements
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique des paiements - {licenceNom}</DialogTitle>
          <DialogDescription>
            Gérer les paiements et renouvellements de cette licence
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">Paiements</h3>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} size="sm">
                Ajouter un paiement
              </Button>
            )}
          </div>

          {showAddForm && (
            <div className="border p-4 rounded-md bg-muted/50">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPaiement)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="date_paiement_prevue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date prévue*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="montant_prevu"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant prévu*</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                  <div className="flex gap-2">
                    <Button type="submit">Ajouter</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        form.reset();
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date prévue</TableHead>
                  <TableHead>Montant prévu</TableHead>
                  <TableHead>Date payée</TableHead>
                  <TableHead>Montant payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : paiements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucun paiement enregistré
                    </TableCell>
                  </TableRow>
                ) : (
                  paiements.map((p) => (
                    <React.Fragment key={p.id}>
                      <TableRow>
                        <TableCell>
                          {new Date(p.date_paiement_prevue).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "XOF",
                            maximumFractionDigits: 0
                          }).format(p.montant_prevu)}
                        </TableCell>
                        <TableCell>
                          {p.date_paiement_effectuee
                            ? new Date(p.date_paiement_effectuee).toLocaleDateString("fr-FR")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {p.montant_paye
                            ? new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "XOF",
                                maximumFractionDigits: 0
                              }).format(p.montant_paye)
                            : "—"}
                        </TableCell>
                        <TableCell>{getStatutBadge(p.statut)}</TableCell>
                        <TableCell className="text-right">
                          {p.statut === "En attente" || p.statut === "En retard" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setValidationPaiementId(p.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Valider
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                      {validationPaiementId === p.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/50">
                            <Form {...validationForm}>
                              <form
                                onSubmit={validationForm.handleSubmit(onSubmitValidation)}
                                className="space-y-4 p-4"
                              >
                                <div className="grid gap-4 sm:grid-cols-3">
                                  <FormField
                                    control={validationForm.control}
                                    name="date_paiement_effectuee"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Date paiement*</FormLabel>
                                        <FormControl>
                                          <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={validationForm.control}
                                    name="montant_paye"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Montant payé*</FormLabel>
                                        <FormControl>
                                          <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={validationForm.control}
                                    name="mode_paiement"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Mode de paiement</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Virement, Carte..." {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={validationForm.control}
                                  name="reference_paiement"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Référence</FormLabel>
                                      <FormControl>
                                        <Input placeholder="N° transaction..." {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={validationForm.control}
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
                                <div className="flex gap-2">
                                  <Button type="submit">
                                    <Check className="h-4 w-4 mr-1" />
                                    Confirmer paiement
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setValidationPaiementId(null);
                                      validationForm.reset();
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Annuler
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
