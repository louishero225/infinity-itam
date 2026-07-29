import { getDuplicateEmployeGroups } from "@/app/(app)/employes/actions";
import { AdministrationPanel } from "@/components/app/administration/administration-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdministrationPage() {
  const duplicateGroups = await getDuplicateEmployeGroups();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Administration ITAM</h1>
        <p className="text-muted-foreground text-sm">
          Import / export inventaire, maintenance des données et fonctions avancées.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Doublons employés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duplicateGroups.length}</div>
          </CardContent>
        </Card>
      </div>

      <AdministrationPanel duplicateGroups={duplicateGroups} />
    </div>
  );
}
