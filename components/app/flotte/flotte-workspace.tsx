"use client";

import { Phone, Truck } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlotteNumerosTable } from "@/components/app/flotte/flotte-numeros-table";
import { DemandesOrangeTable } from "@/components/app/flotte/demandes-orange-table";
import { FlotteImportPanel } from "@/components/app/flotte/flotte-import-panel";
import { NumeroFlotteFormDialog } from "@/components/app/flotte/numero-flotte-form-dialog";
import { DemandeOrangeFormDialog } from "@/components/app/flotte/demande-orange-form-dialog";
import type { DemandeOrangeRow, NumeroFlotteRow } from "@/app/(app)/flotte/actions";

type Props = {
  numeros: NumeroFlotteRow[];
  demandes: DemandeOrangeRow[];
  employes: { id: string; prenom: string; nom: string; departement: string }[];
  canWrite: boolean;
};

export function FlotteWorkspace({ numeros, demandes, employes, canWrite }: Props) {
  return (
    <Tabs defaultValue="numeros" className="gap-4">
      <TabsList className="bg-muted/60 h-auto w-full justify-start gap-1 rounded-xl p-1 sm:w-auto">
        <TabsTrigger value="numeros" className="gap-1.5 rounded-lg px-4 py-2 text-sm">
          <Phone className="size-4" />
          Numéros ({numeros.length})
        </TabsTrigger>
        <TabsTrigger value="orange" className="gap-1.5 rounded-lg px-4 py-2 text-sm">
          <Truck className="size-4" />
          Demandes Orange ({demandes.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="numeros" className="mt-0 space-y-4 outline-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FlotteImportPanel canWrite={canWrite} />
          {canWrite ? <NumeroFlotteFormDialog employes={employes} /> : null}
        </div>
        <FlotteNumerosTable rows={numeros} employes={employes} canWrite={canWrite} />
      </TabsContent>

      <TabsContent value="orange" className="mt-0 space-y-4 outline-none">
        <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm">
          <p className="font-medium">Traçabilité des commandes Orange</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Enregistrez chaque demande (référence dossier, quantité, dates). À la livraison,
            créez les numéros reçus et liez-les à la demande depuis le formulaire numéro.
          </p>
        </div>
        {canWrite ? (
          <div className="flex justify-end">
            <DemandeOrangeFormDialog />
          </div>
        ) : null}
        <DemandesOrangeTable rows={demandes} canWrite={canWrite} />
      </TabsContent>
    </Tabs>
  );
}
