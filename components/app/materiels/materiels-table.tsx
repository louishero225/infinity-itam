"use client";

import Link from "next/link";

import { DataTable } from "@/components/app/data-table";
import { MaterielFormDialog } from "@/components/app/materiels/materiel-form-dialog";
import { Badge } from "@/components/ui/badge";
import { MaterielIcon } from "@/lib/utils/materiel-icons";

type Statut = "Stock" | "Attribué" | "Maintenance" | "Transit";
type Etat = "Neuf" | "Bon" | "Moyen" | "À réparer" | "Hors service";

function normalizeStatut(value: string | null | undefined): Statut {
  if (value === "Attribué") return "Attribué";
  if (value === "Maintenance") return "Maintenance";
  if (value === "Transit") return "Transit";
  return "Stock";
}

function normalizeEtat(value: string | null | undefined): Etat {
  if (value === "Neuf") return "Neuf";
  if (value === "Moyen") return "Moyen";
  if (value === "À réparer") return "À réparer";
  if (value === "Hors service") return "Hors service";
  return "Bon";
}

type MaterielRow = {
  id: string;
  code_materiel: string;
  type: string;
  marque: string | null;
  modele: string | null;
  numero_serie: string | null;
  statut: string | null;
  etat?: string | null;
  site?: string | null;
  date_achat?: string | null;
  cout?: number | null;
  nom_device?: string | null;
  adresse_mac?: string | null;
  adresse_ip?: string | null;
  observations?: string | null;
  salle?: string | null;
};

export function MaterielsTable({ rows }: { rows: MaterielRow[] }) {
  return (
    <DataTable
      data={rows}
      hideSearch={true}
      getRowKey={(r) => r.id}
      columns={[
        {
          key: "code",
          header: "Code",
          cell: (r) => (
            <Link href={`/materiels/${r.id}`} className="font-medium underline">
              {r.code_materiel}
            </Link>
          ),
          searchableText: (r) => r.code_materiel,
          sortValue: (r) => r.code_materiel,
        },
        {
          key: "type",
          header: "Type",
          cell: (r) => (
            <div className="flex items-center gap-2">
              <MaterielIcon type={r.type} className="h-4 w-4 text-muted-foreground" />
              <span>{r.type}</span>
            </div>
          ),
          searchableText: (r) => r.type,
          sortValue: (r) => r.type,
        },
        {
          key: "marque_modele",
          header: "Marque / Modèle",
          cell: (r) => (
            <span>
              {r.marque ?? "—"}
              {r.modele ? ` / ${r.modele}` : ""}
            </span>
          ),
          searchableText: (r) => `${r.marque ?? ""} ${r.modele ?? ""}`,
          sortValue: (r) => `${r.marque ?? ""} ${r.modele ?? ""}`.trim(),
        },
        {
          key: "serie",
          header: "N° série",
          cell: (r) => r.numero_serie ?? "—",
          searchableText: (r) => r.numero_serie ?? "",
          sortValue: (r) => r.numero_serie,
        },
        {
          key: "statut",
          header: "Statut",
          cell: (r) => {
            const statut = r.statut ?? "Stock";
            const colors: Record<string, string> = {
              Stock: "bg-green-100 text-green-800 border-green-300 hover:bg-green-100",
              "Attribué": "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100",
              Maintenance: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100",
              Transit: "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-100",
            };
            const dots: Record<string, string> = {
              Stock: "bg-green-500",
              "Attribué": "bg-blue-500",
              Maintenance: "bg-yellow-500",
              Transit: "bg-gray-500",
            };
            return (
              <Badge className={colors[statut] || colors.Transit}>
                <span className={`h-2 w-2 rounded-full ${dots[statut] || dots.Transit}`} />
                {statut}
              </Badge>
            );
          },
          searchableText: (r) => r.statut ?? "",
          sortValue: (r) => r.statut ?? "Stock",
        },
        {
          key: "actions",
          header: "Actions",
          sortable: false,
          cell: (r) => (
            <div className="flex gap-2">
              <MaterielFormDialog
                mode="edit"
                triggerLabel="Modifier"
                triggerVariant="outline"
                initialValues={{
                id: r.id,
                code_materiel: r.code_materiel,
                type: r.type,
                marque: r.marque ?? undefined,
                modele: r.modele ?? undefined,
                numero_serie: r.numero_serie ?? undefined,
                statut: normalizeStatut(r.statut),
                etat: normalizeEtat(r.etat),
                site: r.site ?? undefined,
                date_achat: r.date_achat ?? undefined,
                cout: r.cout != null ? String(r.cout) : undefined,
                nom_device: r.nom_device ?? undefined,
                adresse_mac: r.adresse_mac ?? undefined,
                adresse_ip: r.adresse_ip ?? undefined,
                observations: r.observations ?? undefined,
                salle: r.salle ?? undefined,
              }}
              />
            </div>
          ),
        },
      ]}
    />
  );
}
