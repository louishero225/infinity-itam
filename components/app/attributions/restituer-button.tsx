"use client";

import { toast } from "sonner";

import { restituerAttribution } from "@/app/(app)/attributions/actions";
import { Button } from "@/components/ui/button";

export function RestituerButton({ attributionId, materielId }: { attributionId: string; materielId: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await restituerAttribution({ attribution_id: attributionId, materiel_id: materielId });
          toast.success("Restitution enregistrée");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Erreur lors de la restitution");
        }
      }}
    >
      Restituer
    </Button>
  );
}
