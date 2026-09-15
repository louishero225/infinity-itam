"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  FicheReceptionMateriel,
  type FicheReceptionData,
} from "@/components/app/attributions/fiche-reception-materiel";

type Listener = (data: FicheReceptionData | null) => void;

let pending: FicheReceptionData | null = null;
const listeners = new Set<Listener>();

/** Affiche la fiche d'impression hors de la ligne du tableau (survit au revalidatePath). */
export function queueRestitutionFiche(data: FicheReceptionData) {
  pending = data;
  listeners.forEach((listen) => listen(data));
}

export function RestitutionFicheHost() {
  const router = useRouter();
  const [data, setData] = React.useState<FicheReceptionData | null>(pending);

  React.useEffect(() => {
    const listen: Listener = (next) => setData(next);
    listeners.add(listen);
    if (pending) setData(pending);
    return () => {
      listeners.delete(listen);
    };
  }, []);

  if (!data) return null;

  return (
    <FicheReceptionMateriel
      data={data}
      open
      hideTrigger
      autoPrint
      onOpenChange={(next) => {
        if (!next) {
          pending = null;
          setData(null);
          router.refresh();
        }
      }}
    />
  );
}
