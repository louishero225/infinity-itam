import { getStaffAccess } from "@/lib/auth/roles";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { FlotteWorkspace } from "@/components/app/flotte/flotte-workspace";
import {
  listDemandesOrange,
  listEmployesForFlotte,
  listNumerosFlotte,
} from "./actions";

export default async function FlottePage() {
  const access = await getStaffAccess();

  let numeros: Awaited<ReturnType<typeof listNumerosFlotte>> = [];
  let demandes: Awaited<ReturnType<typeof listDemandesOrange>> = [];
  let employes: Awaited<ReturnType<typeof listEmployesForFlotte>> = [];

  try {
    [numeros, demandes, employes] = await Promise.all([
      listNumerosFlotte(),
      listDemandesOrange(),
      listEmployesForFlotte(),
    ]);
  } catch (e) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Flotte téléphonique</h1>
        <p className="text-destructive text-sm">
          {e instanceof Error ? e.message : "Erreur de chargement"}
        </p>
        <p className="text-muted-foreground text-sm">
          Appliquez la migration{" "}
          <code className="text-xs">20260824_11_flotte_telephonique.sql</code> dans Supabase.
        </p>
      </div>
    );
  }

  const stats = {
    total: numeros.length,
    attribues: numeros.filter((n) => n.statut === "attribue").length,
    disponibles: numeros.filter((n) => n.statut === "disponible").length,
    demandesOuvertes: demandes.filter((d) => !["livree", "annulee"].includes(d.statut)).length,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Flotte téléphonique"
        description="Registre des numéros Orange, attributions collaborateurs et suivi des demandes."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Numéros enregistrés" value={stats.total} hint="registre flotte" />
        <StatCard label="Attribués" value={stats.attribues} hint="en service" accent="success" />
        <StatCard label="Disponibles" value={stats.disponibles} hint="libres" accent="muted" />
        <StatCard
          label="Demandes Orange"
          value={stats.demandesOuvertes}
          hint="en cours"
          accent={stats.demandesOuvertes > 0 ? "warning" : "success"}
        />
      </div>

      <FlotteWorkspace
        numeros={numeros}
        demandes={demandes}
        employes={employes}
        canWrite={access.canWrite}
      />
    </div>
  );
}
