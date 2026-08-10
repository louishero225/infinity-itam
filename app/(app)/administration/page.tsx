import { getDuplicateEmployeGroups } from "@/app/(app)/employes/actions";
import { AdministrationPanel } from "@/components/app/administration/administration-panel";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";

export default async function AdministrationPage() {
  const duplicateGroups = await getDuplicateEmployeGroups();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administration ITAM"
        description="Import / export inventaire, maintenance des données et fonctions avancées."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Doublons employés"
          value={duplicateGroups.length}
          hint="groupes à fusionner"
          accent={duplicateGroups.length > 0 ? "warning" : "success"}
        />
      </div>

      <AdministrationPanel duplicateGroups={duplicateGroups} />
    </div>
  );
}
