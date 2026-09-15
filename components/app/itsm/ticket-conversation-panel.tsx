"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, UserPlus } from "lucide-react";

import { assignTicket, addTicketCommentFromForm } from "@/app/(app)/itsm/actions";
import { ITSM_QUICK_REPLIES } from "@/lib/itsm/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  ticketId: string;
  canWrite: boolean;
  agentLabel: string;
  currentTechnicien: string;
};

export function TicketConversationPanel({
  ticketId,
  canWrite,
  agentLabel,
  currentTechnicien,
}: Props) {
  const router = useRouter();
  const [contenu, setContenu] = React.useState("");
  const [isInternal, setIsInternal] = React.useState(false);
  const [assigning, setAssigning] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleAssignMe() {
    setAssigning(true);
    try {
      await assignTicket(ticketId, agentLabel);
      toast.success(`Assigné à ${agentLabel}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignation impossible");
    } finally {
      setAssigning(false);
    }
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    try {
      await addTicketCommentFromForm(formData);
      setContenu("");
      setIsInternal(false);
      toast.success(
        isInternal
          ? "Note interne enregistrée"
          : "Réponse publiée — e-mail envoyé si le demandeur a une adresse"
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publication impossible");
    } finally {
      setPending(false);
    }
  }

  if (!canWrite) return null;

  return (
    <div className="space-y-2 border-t bg-muted/20 px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground mr-1 text-[11px] font-medium">Macros</span>
        {ITSM_QUICK_REPLIES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setContenu(m.body);
              setIsInternal(false);
            }}
            className="hover:bg-muted rounded-md border bg-background px-2 py-0.5 text-[11px] font-medium"
          >
            {m.label}
          </button>
        ))}
        {currentTechnicien !== agentLabel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto h-7 gap-1 text-xs"
            disabled={assigning}
            onClick={() => void handleAssignMe()}
          >
            <UserPlus className="size-3.5" />
            M&apos;assigner
          </Button>
        ) : (
          <span className="text-muted-foreground ml-auto text-[11px]">Assigné à vous</span>
        )}
      </div>

      <form action={onSubmit} className="space-y-2">
        <input type="hidden" name="ticket_id" value={ticketId} />
        <input type="hidden" name="is_internal" value={isInternal ? "true" : "false"} />
        <Label htmlFor="contenu" className="sr-only">
          Réponse
        </Label>
        <Textarea
          id="contenu"
          name="contenu"
          rows={3}
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder={
            isInternal
              ? "Note interne (agents uniquement, pas d’e-mail)…"
              : "Réponse publique — notifie le demandeur par e-mail…"
          }
          className={cn(
            "bg-background resize-none",
            isInternal && "border-amber-300 dark:border-amber-800"
          )}
          required
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="accent-amber-600 size-3.5"
            />
            <Lock className="size-3.5" />
            Note interne (non notifiée)
          </label>
          <Button type="submit" size="sm" disabled={pending}>
            {isInternal ? "Enregistrer la note" : "Publier & notifier"}
          </Button>
        </div>
      </form>
    </div>
  );
}
