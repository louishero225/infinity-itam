"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Laptop, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Attribution = {
  id: string;
  date_attribution: string;
  materiel: {
    id: string;
    code_materiel: string;
    type: string;
    marque: string | null;
    modele: string | null;
    numero_serie: string | null;
    statut: string | null;
    cout: number | null;
  } | null;
};

export function EmployeMaterielDialog({
  employeId,
  employeNom,
  employePrenom,
  materielCount,
}: {
  employeId: string;
  employeNom: string;
  employePrenom: string;
  materielCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attributions, setAttributions] = useState<Attribution[]>([]);

  useEffect(() => {
    if (open && attributions.length === 0) {
      loadAttributions();
    }
  }, [open]);

  const loadAttributions = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("attributions")
      .select(
        `
        id,
        date_attribution,
        materiel:materiel_id (
          id,
          code_materiel,
          type,
          marque,
          modele,
          numero_serie,
          statut,
          cout
        )
      `
      )
      .eq("employe_id", employeId)
      .eq("statut", "Actif")
      .order("date_attribution", { ascending: false });

    if (!error && data) {
      setAttributions(data as unknown as Attribution[]);
    }
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const formatMoney = (value: number | null) => {
    if (value == null) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (materielCount === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto p-0 hover:bg-transparent hover:text-primary"
        >
          <div className="flex items-center gap-1.5 text-sm">
            <Laptop className="h-4 w-4" />
            <span className="font-medium">{materielCount}</span>
            <span className="text-muted-foreground">
              équipement{materielCount > 1 ? "s" : ""}
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Matériel attribué à {employePrenom} {employeNom}
          </DialogTitle>
          <DialogDescription>
            Liste des équipements actuellement en possession de cet employé
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : attributions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun équipement trouvé
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Marque/Modèle</TableHead>
                  <TableHead>N° Série</TableHead>
                  <TableHead>Date attribution</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributions.map((attr) => {
                  const mat = attr.materiel;
                  if (!mat) return null;

                  return (
                    <TableRow key={attr.id}>
                      <TableCell className="font-medium">
                        {mat.code_materiel}
                      </TableCell>
                      <TableCell>{mat.type}</TableCell>
                      <TableCell>
                        {mat.marque && mat.modele
                          ? `${mat.marque} ${mat.modele}`
                          : mat.marque || mat.modele || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {mat.numero_serie || "—"}
                      </TableCell>
                      <TableCell>{formatDate(attr.date_attribution)}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(mat.cout)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mat.statut === "Attribué"
                              ? "default"
                              : mat.statut === "Maintenance"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {mat.statut || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && attributions.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
            <span>Total: {attributions.length} équipement(s)</span>
            <span>
              Valeur totale:{" "}
              {formatMoney(
                attributions.reduce((sum, a) => sum + (a.materiel?.cout ?? 0), 0)
              )}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
