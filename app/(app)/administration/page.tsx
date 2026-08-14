import { redirect } from "next/navigation";
import { getDuplicateEmployeGroups } from "@/app/(app)/employes/actions";
import { listAdminUsers } from "@/app/(app)/administration/users-actions";
import { AdministrationPanel } from "@/components/app/administration/administration-panel";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { requireAdmin } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdministrationPage() {
  let access;
  try {
    access = await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  let users: Awaited<ReturnType<typeof listAdminUsers>> = [];
  let duplicateGroups: Awaited<ReturnType<typeof getDuplicateEmployeGroups>> = [];
  try {
    [duplicateGroups, users] = await Promise.all([
      getDuplicateEmployeGroups(),
      listAdminUsers(),
    ]);
  } catch {
    duplicateGroups = await getDuplicateEmployeGroups().catch(() => []);
  }

  const supabase = await createSupabaseServerClient();
  const { data: meCompte } = await supabase
    .from("comptes_systeme")
    .select("id")
    .eq("id", access.userId)
    .maybeSingle();

  const admins = users.filter((u) => u.roles.includes("admin")).length;
  const iAmRegistered = Boolean(meCompte);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administration ITAM"
        description="Utilisateurs & rôles, import / export inventaire, maintenance des données."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Utilisateurs"
          value={users.length}
          hint="comptes visibles"
          accent="default"
        />
        <StatCard
          label="Admins"
          value={admins}
          hint="rôle admin"
          accent={admins > 0 ? "success" : "warning"}
        />
        <StatCard
          label="Doublons employés"
          value={duplicateGroups.length}
          hint="groupes à fusionner"
          accent={duplicateGroups.length > 0 ? "warning" : "success"}
        />
      </div>

      <AdministrationPanel
        duplicateGroups={duplicateGroups}
        users={users}
        currentUserId={access.userId}
        currentUserEmail={access.email}
        hasServiceRole={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}
        iAmRegistered={iAmRegistered}
      />
    </div>
  );
}
