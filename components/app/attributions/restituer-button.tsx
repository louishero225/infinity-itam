"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { restituerAttribution } from "@/app/(app)/attributions/actions";
import { Button } from "@/components/ui/button";

export function RestituerButton({ attributionId, materielId }: { attributionId: string; materielId: string }) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await restituerAttribution({ attribution_id: attributionId, materiel_id: materielId });
          toast.success("Restitution enregistrée");
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Erreur lors de la restitution");
        }
      }}
    >
      Restituer
    </Button>
  );
}
