import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeActions } from "@/components/app/employes/employe-actions";

type EmployeRow = {
  id: string;
  prenom: string;
  nom: string;
  departement: string;
  service: string | null;
  fonction: string | null;
  site: string | null;
  matricule: string | null;
  statut: string | null;
};

type AttributionRow = {
  id: string;
  date_attribution: string;
  date_restitution: string | null;
  statut: string | null;
  beneficiaire_type: string | null;
  beneficiaire_label: string | null;
  materiel: { id: string; code_materiel: string; type: string } | null;
};

export default async function EmployeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: employe, error: empError }, { data: actifs }, { data: histo }] =
    await Promise.all([
      supabase
        .from("employes")
        .select("*")
        .eq("id", id)
        .single<EmployeRow>(),
      supabase
        .from("attributions")
        .select(
          `id, date_attribution, date_restitution, statut, beneficiaire_type, beneficiaire_label,
           materiel:materiel_id (id, code_materiel, type)`
        )
        .eq("employe_id", id)
        .eq("statut", "Actif")
        .order("date_attribution", { ascending: false })
        .returns<AttributionRow[]>(),
      supabase
        .from("attributions")
        .select(
          `id, date_attribution, date_restitution, statut, beneficiaire_type, beneficiaire_label,
           materiel:materiel_id (id, code_materiel, type)`
        )
        .eq("employe_id", id)
        .order("date_attribution", { ascending: false })
        .limit(200)
        .returns<AttributionRow[]>(),
    ]);

  if (empError) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Employé</h1>
        <p className="text-destructive text-sm">{empError.message}</p>
      </div>
    );
  }

  const nombreMaterielsActifs = (actifs ?? []).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${employe.prenom} ${employe.nom}`}
        description={`${employe.departement}${employe.service ? ` • ${employe.service}` : ""}${employe.fonction ? ` • ${employe.fonction}` : ""}`}
        backHref="/destinataires?tab=personnes"
        backLabel="Retour aux destinataires"
        actions={
          <EmployeActions
            employeId={id}
            employeNom={`${employe.prenom} ${employe.nom}`}
            nombreMateriels={nombreMaterielsActifs}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Matricule: </span>
            {employe.matricule ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Site: </span>
            {employe.site ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Statut: </span>
            {employe.statut ?? "—"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Matériels attribués (actifs)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(actifs ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.materiel ? (
                      <Link href={`/materiels/${a.materiel.id}`} className="underline">
                        {a.materiel.code_materiel}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{a.materiel?.type ?? "—"}</TableCell>
                  <TableCell>{a.date_attribution}</TableCell>
                </TableRow>
              ))}
              {(actifs ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Aucun matériel attribué.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                <TableHead>Matériel</TableHead>
                <TableHead>Date attribution</TableHead>
                <TableHead>Retour</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(histo ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.materiel ? (
                      <Link href={`/materiels/${a.materiel.id}`} className="underline">
                        {a.materiel.code_materiel}
                      </Link>
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
    </div>
  );
}
