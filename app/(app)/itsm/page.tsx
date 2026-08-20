import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { getAccess } from "@/lib/auth/roles";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { ItsmToolsPanel } from "@/components/app/itsm/itsm-tools-panel";
import { ItsmWorkspace } from "@/components/app/itsm/itsm-workspace";
import { ItsmTicketsTable } from "@/components/app/itsm/itsm-tickets-table";
import { ItsmCreateTicketForm } from "@/components/app/itsm/itsm-create-ticket-form";
import { Button } from "@/components/ui/button";

import {
  getFaitsMarquantsToday,
  getItsmStats,
  listEmployesForItsm,
  listTickets,
} from "./actions";

export default async function ItsTmPage() {
  const access = await getAccess().catch(() => null);
  if (!access) redirect("/dashboard");

  const [tickets, stats, employes, faits] = await Promise.all([
    listTickets().catch(() => []),
    getItsmStats().catch(() => ({ total: 0, ouverts: 0, enRetard: 0, resolus: 0 })),
    listEmployesForItsm().catch(() => []),
    getFaitsMarquantsToday().catch(() => ""),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tickets support"
        description="Gestion des demandes IT, import ManageEngine et onboarding."
        actions={
          access.canWrite ? (
            <Button asChild>
              <Link href="/itsm?tab=nouveau">
                <Plus className="size-4" />
                Nouveau ticket
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} hint="tous statuts" />
        <StatCard
          label="À traiter"
          value={stats.ouverts}
          hint="ouverts / en cours"
          accent={stats.ouverts > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Retard SLA"
          value={stats.enRetard}
          hint="> 30 jours"
          accent={stats.enRetard > 0 ? "danger" : "success"}
        />
        <StatCard label="Clôturés" value={stats.resolus} hint="résolus / fermés" accent="muted" />
      </div>

      <Suspense fallback={<p className="text-muted-foreground text-sm">Chargement…</p>}>
        <ItsmWorkspace
          liste={<ItsmTicketsTable tickets={tickets} />}
          nouveau={<ItsmCreateTicketForm canWrite={access.canWrite} employes={employes} />}
          outils={<ItsmToolsPanel canWrite={access.canWrite} initialFaits={faits} employes={employes} />}
        />
      </Suspense>
    </div>
  );
}
