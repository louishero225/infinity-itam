import { Suspense, type ComponentType } from "react";
import Link from "next/link";
import { Clock3, Inbox, Plus, TicketCheck } from "lucide-react";

import { getStaffAccess } from "@/lib/auth/roles";
import { ItsmToolsPanel } from "@/components/app/itsm/itsm-tools-panel";
import { ItsmWorkspace } from "@/components/app/itsm/itsm-workspace";
import { ItsmTicketsTable } from "@/components/app/itsm/itsm-tickets-table";
import { ItsmKanbanBoard } from "@/components/app/itsm/itsm-kanban-board";
import { ItsmCreateTicketForm } from "@/components/app/itsm/itsm-create-ticket-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DEFAULT_TECHNICIAN } from "@/lib/itsm/constants";

import {
  getFaitsMarquantsToday,
  getItsmStats,
  listEmployesForItsm,
  listTickets,
} from "./actions";

function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "warn" | "danger" | "ok";
}) {
  const toneClass = {
    default: "border-border",
    warn: "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
    danger: "border-red-200/80 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20",
    ok: "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20",
  }[tone];

  return (
    <div className={cn("rounded-xl border px-4 py-3 shadow-sm", toneClass)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
          {label}
        </p>
        <Icon className="text-muted-foreground size-4" />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
    </div>
  );
}

export default async function ItsTmPage() {
  const access = await getStaffAccess();

  const [tickets, stats, employes, faits] = await Promise.all([
    listTickets().catch(() => []),
    getItsmStats().catch(() => ({ total: 0, ouverts: 0, enRetard: 0, resolus: 0 })),
    listEmployesForItsm().catch(() => []),
    getFaitsMarquantsToday().catch(() => ""),
  ]);

  const agentLabel = DEFAULT_TECHNICIAN;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
            Service Desk
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Console tickets</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            File, Kanban, SLA par priorité (High 3 j · Medium 7 j · Normal 14 j) et opérations.
          </p>
        </div>
        {access.canWrite ? (
          <Button asChild className="shrink-0">
            <Link href="/itsm?tab=nouveau">
              <Plus className="size-4" />
              Nouveau ticket
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Volume" value={stats.total} hint="tous statuts" icon={Inbox} />
        <MetricTile
          label="File active"
          value={stats.ouverts}
          hint="ouverts / en cours"
          icon={Clock3}
          tone={stats.ouverts > 0 ? "warn" : "ok"}
        />
        <MetricTile
          label="SLA en retard"
          value={stats.enRetard}
          hint="selon priorité"
          icon={Clock3}
          tone={stats.enRetard > 0 ? "danger" : "ok"}
        />
        <MetricTile
          label="Clôturés"
          value={stats.resolus}
          hint="résolus / fermés"
          icon={TicketCheck}
          tone="ok"
        />
      </div>

      <Suspense fallback={<p className="text-muted-foreground text-sm">Chargement de la file…</p>}>
        <ItsmWorkspace
          liste={
            <ItsmTicketsTable
              tickets={tickets}
              canWrite={access.canWrite}
              agentLabel={agentLabel}
              agentEmail={access.email}
            />
          }
          kanban={<ItsmKanbanBoard tickets={tickets} canWrite={access.canWrite} />}
          nouveau={<ItsmCreateTicketForm canWrite={access.canWrite} employes={employes} />}
          outils={
            <ItsmToolsPanel canWrite={access.canWrite} initialFaits={faits} employes={employes} />
          }
        />
      </Suspense>
    </div>
  );
}
