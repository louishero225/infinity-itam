"use client";

import * as React from "react";
import { Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FicheRemiseGroupee } from "@/components/app/attributions/fiche-remise-groupee";

type FicheGroupeeData = React.ComponentProps<typeof FicheRemiseGroupee>["data"];

export function FicheOnboardingButton({
  employeId,
  attributionIds,
  label = "Fiche onboarding",
  variant = "outline",
  size = "sm",
}: {
  employeId: string;
  attributionIds?: string[];
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [ficheData, setFicheData] = React.useState<FicheGroupeeData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function loadFiche() {
    setLoading(true);
    setError(null);
    try {
      const params = attributionIds?.length
        ? `?ids=${encodeURIComponent(attributionIds.join(","))}`
        : "";
      const response = await fetch(`/api/attributions/groupee/${employeId}${params}`);
      if (!response.ok) {
        throw new Error("Impossible de charger la fiche d'onboarding");
      }
      const data = (await response.json()) as FicheGroupeeData;
      setFicheData(data);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function openPrintTab() {
    const params = attributionIds?.length
      ? `?ids=${encodeURIComponent(attributionIds.join(","))}`
      : "";
    window.open(`/api/attributions/groupee/${employeId}/fiche${params}`, "_blank");
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button type="button" variant={variant} size={size} onClick={loadFiche} disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Printer className="size-4" />
              {label}
            </>
          )}
        </Button>
        {error ? <span className="text-destructive text-xs">{error}</span> : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche de remise — kit d&apos;onboarding</DialogTitle>
            <DialogDescription>
              Vérifiez le contenu puis imprimez la fiche pour signature.
            </DialogDescription>
          </DialogHeader>
          {ficheData ? <FicheRemiseGroupee data={ficheData} /> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Fermer
            </Button>
            <Button type="button" onClick={openPrintTab}>
              Ouvrir pour impression
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
