"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deleteLicence } from "@/app/(app)/licences/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LicenceFormDialog } from "./licence-form-dialog";
import { useSortableRows } from "@/components/app/sortable-table-head";

const PaiementsDialog = dynamic(
  () => import("./paiements-dialog").then((mod) => ({ default: mod.PaiementsDialog })),
  { ssr: false }
);

type LicenceRow = {
  id: string;
  nom: string;
  editeur: string | null;
  type_licence: string | null;
  date_expiration: string | null;
  statut: string;
  nombre_postes: number | null;
  postes_utilises: number | null;
  cout: number | null;
  numero_licence: string | null;
  cle_produit: string | null;
  date_achat: string | null;
  materiel_id: string | null;
  gestionnaire_id: string | null;
  contact_support: string | null;
  url_telechargement: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean | null;
  gestionnaire?: {
    prenom: string;
    nom: string;
    departement: string | null;
  } | null;
};

export function LicencesTable({ rows }: { rows: LicenceRow[] }) {
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const sortAccessors = React.useMemo(
    () => ({
      nom: (r: LicenceRow) => r.nom,
      editeur: (r: LicenceRow) => r.editeur,
      gestionnaire: (r: LicenceRow) =>
        r.gestionnaire ? `${r.gestionnaire.nom} ${r.gestionnaire.prenom}` : "",
      expiration: (r: LicenceRow) => r.date_expiration,
      postes: (r: LicenceRow) => r.postes_utilises ?? 0,
      statut: (r: LicenceRow) => r.statut,
    }),
    []
  );

  const { sortedData, renderHead } = useSortableRows(rows, sortAccessors);

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Supprimer la licence "${nom}" ?`)) return;

    try {
      setDeleting(id);
      await deleteLicence(id);
      toast.success("Licence supprimée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setDeleting(null);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "Active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "Expirée":
        return <Badge variant="destructive">Expirée</Badge>;
      case "En attente":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">En attente</Badge>;
      case "Résiliée":
        return <Badge variant="secondary">Résiliée</Badge>;
      default:
        return <Badge>—</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {renderHead("nom", "Nom")}
            {renderHead("editeur", "Éditeur")}
            {renderHead("gestionnaire", "Gestionnaire")}
            {renderHead("expiration", "Expiration")}
            {renderHead("postes", "Postes")}
            {renderHead("statut", "Statut")}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.nom}</TableCell>
              <TableCell>{row.editeur ?? "—"}</TableCell>
              <TableCell>
                {row.gestionnaire
                  ? `${row.gestionnaire.prenom} ${row.gestionnaire.nom}`
                  : "—"}
              </TableCell>
              <TableCell>
                {row.date_expiration
                  ? new Date(row.date_expiration).toLocaleDateString("fr-FR")
                  : "—"}
              </TableCell>
              <TableCell>
                {row.postes_utilises ?? 0}/{row.nombre_postes ?? 0}
              </TableCell>
              <TableCell>{getStatutBadge(row.statut)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <PaiementsDialog licenceId={row.id} licenceNom={row.nom} />
                  <LicenceFormDialog 
                    mode="edit" 
                    initialValues={{
                      id: row.id,
                      nom: row.nom,
                      editeur: row.editeur || undefined,
                      type_licence: row.type_licence as any,
                      gestionnaire_id: row.gestionnaire_id || undefined,
                      numero_licence: row.numero_licence || undefined,
                      cle_produit: row.cle_produit || undefined,
                      date_achat: row.date_achat || undefined,
                      date_expiration: row.date_expiration || undefined,
                      cout: row.cout ? String(row.cout) : undefined,
                      nombre_postes: row.nombre_postes ? String(row.nombre_postes) : undefined,
                      postes_utilises: row.postes_utilises ? String(row.postes_utilises) : undefined,
                      contact_support: row.contact_support || undefined,
                      url_telechargement: row.url_telechargement || undefined,
                      notes: row.notes || undefined,
                      statut: row.statut as any,
                      is_active: row.is_active ?? true,
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(row.id, row.nom)}
                    disabled={deleting === row.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sortedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Aucune licence
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
