"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Filter, Search } from "lucide-react";

import type { IitsmTicket } from "@/app/(app)/itsm/actions";
import { bulkUpdateTickets } from "@/app/(app)/itsm/actions";
import {
  ItsmPrioriteBadge,
  ItsmStatutBadge,
  ticketRefLabel,
} from "@/components/app/itsm/itsm-status";
import { ItsmSlaClock } from "@/components/app/itsm/itsm-sla-clock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_TECHNICIAN, ITSM_STATUTS } from "@/lib/itsm/constants";
import { cn } from "@/lib/utils";

type FilterId = "tous" | "queue" | "sla" | "mine" | "unassigned" | "clos";

function isAssignedToAgent(t: IitsmTicket, agentLabel: string, agentEmail: string | null) {
  const tech = (t.technicien || "").trim().toLowerCase();
  if (!tech || tech === "non assigné") return false;
  if (agentLabel && tech === agentLabel.toLowerCase()) return true;
  if (agentEmail && tech === agentEmail.toLowerCase()) return true;
  if (agentEmail) {
    const local = agentEmail.split("@")[0]?.toLowerCase();
    if (local && tech.includes(local)) return true;
  }
  return false;
}

function isUnassigned(t: IitsmTicket) {
  const tech = (t.technicien || "").trim().toLowerCase();
  return !tech || tech === "non assigné";
}

export function ItsmTicketsTable({
  tickets,
  canWrite,
  agentLabel,
  agentEmail,
}: {
  tickets: IitsmTicket[];
  canWrite: boolean;
  agentLabel: string;
  agentEmail: string | null;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<FilterId>("queue");
  const [statut, setStatut] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filter === "queue" && (t.statut === "Résolu" || t.statut === "Fermé")) return false;
      if (filter === "sla" && !t.en_retard) return false;
      if (filter === "clos" && t.statut !== "Résolu" && t.statut !== "Fermé") return false;
      if (filter === "mine" && !isAssignedToAgent(t, agentLabel, agentEmail)) return false;
      if (filter === "unassigned" && !isUnassigned(t)) return false;
      if (statut !== "all" && t.statut !== statut) return false;
      if (!query) return true;
      const hay = [
        t.demandeur,
        t.categorie,
        t.entite,
        t.description ?? "",
        t.ticket_ref ?? "",
        t.statut,
        t.technicien,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [tickets, q, filter, statut, agentLabel, agentEmail]);

  const counts = React.useMemo(
    () => ({
      tous: tickets.length,
      queue: tickets.filter((t) => t.statut === "Ouvert" || t.statut === "En cours").length,
      sla: tickets.filter((t) => t.en_retard).length,
      mine: tickets.filter((t) => isAssignedToAgent(t, agentLabel, agentEmail)).length,
      unassigned: tickets.filter(isUnassigned).length,
      clos: tickets.filter((t) => t.statut === "Résolu" || t.statut === "Fermé").length,
    }),
    [tickets, agentLabel, agentEmail]
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((t) => selected.has(t.id));

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filtered.map((t) => t.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(patch: { statut?: IitsmTicket["statut"]; technicien?: string }) {
    if (!canWrite || selected.size === 0) return;
    setBulkBusy(true);
    try {
      const res = await bulkUpdateTickets({
        ticketIds: [...selected],
        ...patch,
      });
      toast.success(`${res.updated} ticket(s) mis à jour`);
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action en masse impossible");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">File d&apos;attente</h2>
          <p className="text-muted-foreground text-xs">
            {filtered.length} sur {tickets.length} ticket(s) — vue agent
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher demandeur, catégorie, agent…"
              className="h-8 bg-background pl-8 text-sm"
            />
          </div>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="border-input bg-background h-8 rounded-md border px-2 text-xs"
          >
            <option value="all">Tous les statuts</option>
            {ITSM_STATUTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b px-3 py-2">
        {(
          [
            ["queue", "À traiter", counts.queue],
            ["mine", "Mes tickets", counts.mine],
            ["unassigned", "Non assignés", counts.unassigned],
            ["sla", "Retard SLA", counts.sla],
            ["tous", "Tous", counts.tous],
            ["clos", "Clôturés", counts.clos],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              filter === id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {id === "sla" ? <Filter className="size-3" /> : null}
            {label}
            <span className="tabular-nums opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {canWrite && selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b bg-sky-50/80 px-3 py-2 dark:bg-sky-950/20">
          <span className="text-xs font-medium tabular-nums">{selected.size} sélectionné(s)</span>
          <select
            disabled={bulkBusy}
            defaultValue=""
            className="border-input bg-background h-7 rounded-md border px-2 text-xs"
            onChange={(e) => {
              const v = e.target.value as IitsmTicket["statut"] | "";
              if (v) void runBulk({ statut: v });
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              Statut…
            </option>
            {ITSM_STATUTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={bulkBusy}
            onClick={() => void runBulk({ technicien: agentLabel || DEFAULT_TECHNICIAN })}
          >
            M&apos;assigner
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={bulkBusy}
            onClick={() => void runBulk({ technicien: "Non assigné" })}
          >
            Désassigner
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setSelected(new Set())}
          >
            Annuler
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {canWrite ? (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    aria-label="Tout sélectionner"
                    className="accent-foreground size-3.5"
                  />
                </TableHead>
              ) : null}
              <TableHead className="w-[110px]">Réf.</TableHead>
              <TableHead className="w-[120px]">Ouvert</TableHead>
              <TableHead>Demandeur</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canWrite ? 10 : 9}
                  className="text-muted-foreground py-12 text-center text-sm"
                >
                  Aucun ticket dans cette vue.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow
                  key={t.id}
                  className={cn("group", t.en_retard && "bg-red-50/40 dark:bg-red-950/10")}
                >
                  {canWrite ? (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={() => toggleOne(t.id)}
                        aria-label={`Sélectionner ${ticketRefLabel(t)}`}
                        className="accent-foreground size-3.5"
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="font-mono text-xs font-medium tabular-nums">
                    <Link
                      href={`/itsm/tickets/${t.id}`}
                      className="hover:text-sky-700 hover:underline dark:hover:text-sky-300"
                    >
                      {ticketRefLabel(t)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-xs tabular-nums">
                    {t.date}
                    <span className="ml-1 opacity-70">{String(t.heure_creation).slice(0, 5)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[160px] truncate text-sm font-medium">{t.demandeur}</div>
                    <div className="text-muted-foreground truncate text-xs">{t.entite || "—"}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[140px] truncate text-sm">
                    {t.categorie}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[120px] truncate text-xs">
                    {isUnassigned(t) ? "—" : t.technicien}
                  </TableCell>
                  <TableCell>
                    <ItsmPrioriteBadge priorite={t.priorite} />
                  </TableCell>
                  <TableCell>
                    <ItsmStatutBadge statut={t.statut} />
                  </TableCell>
                  <TableCell>
                    <ItsmSlaClock
                      date={t.date}
                      heure_creation={t.heure_creation}
                      resolved_at={t.resolved_at}
                      statut={t.statut}
                      priorite={t.priorite}
                      compact
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-70 group-hover:opacity-100"
                      asChild
                    >
                      <Link href={`/itsm/tickets/${t.id}`}>Ouvrir</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
