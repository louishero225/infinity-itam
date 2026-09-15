"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { IitsmTicket } from "@/app/(app)/itsm/actions";
import { updateTicketStatut } from "@/app/(app)/itsm/actions";
import {
  ItsmPrioriteBadge,
  ItsmStatutBadge,
  ticketRefLabel,
} from "@/components/app/itsm/itsm-status";
import { ItsmSlaClock } from "@/components/app/itsm/itsm-sla-clock";
import { ITSM_STATUTS } from "@/lib/itsm/constants";
import { cn } from "@/lib/utils";

type Props = {
  tickets: IitsmTicket[];
  canWrite: boolean;
};

export function ItsmKanbanBoard({ tickets, canWrite }: Props) {
  const router = useRouter();
  const [local, setLocal] = React.useState(tickets);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLocal(tickets);
  }, [tickets]);

  async function moveTicket(ticketId: string, statut: IitsmTicket["statut"]) {
    const current = local.find((t) => t.id === ticketId);
    if (!current || current.statut === statut) return;
    if (!canWrite) {
      toast.error("Lecture seule");
      return;
    }

    setBusyId(ticketId);
    setLocal((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              statut,
              resolved_at:
                statut === "Résolu" || statut === "Fermé"
                  ? t.resolved_at ?? new Date().toISOString()
                  : null,
            }
          : t
      )
    );

    try {
      await updateTicketStatut(ticketId, statut);
      router.refresh();
    } catch (e) {
      setLocal(tickets);
      toast.error(e instanceof Error ? e.message : "Impossible de déplacer le ticket");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[960px] gap-3">
        {ITSM_STATUTS.map((statut) => {
          const column = local.filter((t) => t.statut === statut);
          return (
            <div
              key={statut}
              className={cn(
                "bg-muted/40 flex w-[240px] shrink-0 flex-col rounded-xl border",
                draggingId ? "ring-offset-background" : ""
              )}
              onDragOver={(e) => {
                if (!canWrite) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/ticket-id");
                if (id) void moveTicket(id, statut);
                setDraggingId(null);
              }}
            >
              <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                <ItsmStatutBadge statut={statut} />
                <span className="text-muted-foreground text-xs font-medium tabular-nums">
                  {column.length}
                </span>
              </div>
              <div className="flex max-h-[min(70vh,720px)] flex-col gap-2 overflow-y-auto p-2">
                {column.length === 0 ? (
                  <p className="text-muted-foreground px-1 py-6 text-center text-[11px]">
                    Déposer ici
                  </p>
                ) : (
                  column.map((t) => (
                    <article
                      key={t.id}
                      draggable={canWrite && busyId !== t.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/ticket-id", t.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(t.id);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                      className={cn(
                        "rounded-lg border bg-card p-2.5 shadow-sm transition-opacity",
                        canWrite && "cursor-grab active:cursor-grabbing",
                        draggingId === t.id && "opacity-50",
                        busyId === t.id && "opacity-60",
                        t.en_retard && "border-red-200 dark:border-red-900/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/itsm/tickets/${t.id}`}
                          className="font-mono text-[11px] font-semibold text-sky-700 hover:underline dark:text-sky-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ticketRefLabel(t)}
                        </Link>
                        <ItsmPrioriteBadge priorite={t.priorite} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">
                        {t.categorie}
                      </p>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">{t.demandeur}</p>
                      <div className="mt-2">
                        <ItsmSlaClock
                          date={t.date}
                          heure_creation={t.heure_creation}
                          resolved_at={t.resolved_at}
                          statut={t.statut}
                          priorite={t.priorite}
                          compact
                        />
                      </div>
                      {canWrite ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ITSM_STATUTS.filter((s) => s !== t.statut).map((s) => (
                            <button
                              key={s}
                              type="button"
                              disabled={busyId === t.id}
                              onClick={() => void moveTicket(t.id, s)}
                              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded px-1.5 py-0.5 text-[10px] font-medium"
                            >
                              → {s}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Glissez-déposez une carte entre colonnes, ou utilisez les raccourcis → Statut.
      </p>
    </div>
  );
}
