import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AuditPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, created_at, user_email, action, entity_type, entity_id, details")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Journal d'audit"
        description="Actions sensibles : attributions, restitutions, imports, pièces jointes."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">200 dernières actions</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-muted-foreground text-sm">
              Journal indisponible. Appliquez la migration SQL 20260812_05.
            </p>
          ) : (data ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune entrée pour le moment.</p>
          ) : (
            <div className="overflow-x-auto text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Utilisateur</th>
                    <th className="py-2 pr-3">Action</th>
                    <th className="py-2 pr-3">Cible</th>
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-2 pr-3">{row.user_email ?? "—"}</td>
                      <td className="py-2 pr-3">{row.action}</td>
                      <td className="py-2 pr-3">
                        {row.entity_type ?? "—"}
                        {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
