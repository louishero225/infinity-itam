import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { PiecesJointesCard } from "@/components/app/pieces-jointes-card";
import { MaterielTicketsCard } from "@/components/app/materiels/materiel-tickets-card";
import { listPiecesJointes } from "@/app/(app)/fichiers/actions";
import { listTicketsForEmploye } from "@/app/(app)/itsm/actions";
import { employeDisplayName } from "@/lib/utils/employe-matching";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MaterielRow = {
  id: string;
  code_materiel: string;
  type: string;
  marque: string | null;
  modele: string | null;
  numero_serie: string | null;
  site: string | null;
  etat: string | null;
  statut: string | null;
  date_achat: string | null;
  cout: number | null;
  nom_device: string | null;
  adresse_mac: string | null;
  adresse_ip: string | null;
  observations: string | null;
};

type AttributionRow = {
  id: string;
  date_attribution: string;
  date_restitution: string | null;
  statut: string | null;
  beneficiaire_type: string | null;
  beneficiaire_label: string | null;
  employe: { id: string; prenom: string; nom: string; departement: string } | null;
};

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function MaterielDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: materiel, error: matError }, { data: actuel }, { data: histo }] =
    await Promise.all([
      supabase
        .from("materiels")
        .select("*")
        .eq("id", id)
        .single<MaterielRow>(),
      supabase
        .from("attributions")
        .select(
          `id, date_attribution, date_restitution, statut, beneficiaire_type, beneficiaire_label,
           employe:employe_id (id, prenom, nom, departement)`
        )
        .eq("materiel_id", id)
        .eq("statut", "Actif")
        .order("date_attribution", { ascending: false })
        .maybeSingle<AttributionRow>(),
      supabase
        .from("attributions")
        .select(
          `id, date_attribution, date_restitution, statut, beneficiaire_type, beneficiaire_label,
           employe:employe_id (id, prenom, nom, departement)`
        )
        .eq("materiel_id", id)
        .order("date_attribution", { ascending: false })
        .limit(200)
        .returns<AttributionRow[]>(),
    ]);

  const pieces = await listPiecesJointes("materiel", id);

  if (matError) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Matériel</h1>
        <p className="text-destructive text-sm">{matError.message}</p>
      </div>
    );
  }

  const detenteur = actuel?.employe ?? null;
  const ticketsDetenteur = detenteur
    ? await listTicketsForEmploye(detenteur.id).catch(() => [])
    : [];
  const detenteurLabel = detenteur
    ? employeDisplayName(detenteur.prenom, detenteur.nom)
    : null;

  const beneficiaire = (() => {
    if (!actuel) return null;
    if (actuel.employe) {
      return (
        <Link href={`/employes/${actuel.employe.id}`} className="underline">
          {actuel.employe.prenom} {actuel.employe.nom} ({actuel.employe.departement})
        </Link>
      );
    }
    if (actuel.beneficiaire_type === "societe") return actuel.beneficiaire_label ?? "Société";
    if (actuel.beneficiaire_type === "departement") return actuel.beneficiaire_label ?? "Département";
    return "—";
  })();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={materiel.code_materiel}
        description={`${materiel.type}${materiel.marque ? ` • ${materiel.marque}` : ""}${materiel.modele ? ` / ${materiel.modele}` : ""}`}
        backHref="/materiels"
        backLabel="Retour au matériel"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fiche matériel</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Statut: </span>
            {materiel.statut ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">État: </span>
            {materiel.etat ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">N° série: </span>
            {materiel.numero_serie ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Nom device: </span>
            {materiel.nom_device ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">MAC: </span>
            {materiel.adresse_mac ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">IP: </span>
            {materiel.adresse_ip ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Site: </span>
            {materiel.site ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Date achat: </span>
            {materiel.date_achat ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Coût: </span>
            {formatMoney(materiel.cout)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">QR code</CardTitle>
        </CardHeader>
        <CardContent>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/materiels/${materiel.id}/qr`}
            alt={`QR ${materiel.code_materiel}`}
            className="w-full max-w-[180px] rounded-md border bg-white p-2"
          />
          <p className="text-muted-foreground mt-2 text-xs">{materiel.code_materiel}</p>
        </CardContent>
      </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Attribution actuelle</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {actuel ? (
            <div className="grid gap-2">
              <div>
                <span className="text-muted-foreground">Bénéficiaire: </span>
                {beneficiaire}
              </div>
              <div>
                <span className="text-muted-foreground">Date: </span>
                {actuel.date_attribution}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Aucune attribution active.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Date attribution</TableHead>
                <TableHead>Retour</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(histo ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    {a.employe ? (
                      <Link href={`/employes/${a.employe.id}`} className="underline">
                        {a.employe.prenom} {a.employe.nom} ({a.employe.departement})
                      </Link>
                    ) : a.beneficiaire_type === "societe" ? (
                      a.beneficiaire_label ?? "Société"
                    ) : a.beneficiaire_type === "departement" ? (
                      a.beneficiaire_label ?? "Département"
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{a.date_attribution}</TableCell>
                  <TableCell>{a.date_restitution ?? "—"}</TableCell>
                  <TableCell>{a.statut ?? "—"}</TableCell>
                </TableRow>
              ))}
              {(histo ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Aucun historique.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MaterielTicketsCard tickets={ticketsDetenteur} detenteurLabel={detenteurLabel} />

      {materiel.observations ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Observations</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {materiel.observations}
          </CardContent>
        </Card>
      ) : null}

      <PiecesJointesCard entityType="materiel" entityId={materiel.id} pieces={pieces} />
    </div>
  );
}
