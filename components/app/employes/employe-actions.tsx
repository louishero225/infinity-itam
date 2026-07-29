"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { RestitutionGroupeeDialog } from "./restitution-groupee-dialog";

export function EmployeActions({
  employeId,
  employeNom,
  nombreMateriels,
}: {
  employeId: string;
  employeNom: string;
  nombreMateriels: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/api/attributions/groupee/${employeId}/fiche`} target="_blank">
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Fiche Groupée
        </Button>
      </Link>
      <RestitutionGroupeeDialog
        employeId={employeId}
        employeNom={employeNom}
        nombreMateriels={nombreMateriels}
      />
      <Link href="/employes" className="text-sm underline">
        Retour
      </Link>
    </div>
  );
}
