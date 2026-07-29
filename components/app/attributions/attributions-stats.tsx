"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Laptop, Building2, Calendar } from "lucide-react";

type AttributionsStatsProps = {
  total: number;
  parEmploye: number;
  parDepartement: number;
  parSociete: number;
  dureeeMoyenne?: number;
};

export function AttributionsStats({
  total,
  parEmploye,
  parDepartement,
  parSociete,
  dureeeMoyenne,
}: AttributionsStatsProps) {
  const formatDuree = (jours: number | undefined) => {
    if (!jours) return "—";
    if (jours < 30) return `${Math.round(jours)}j`;
    if (jours < 365) return `${Math.round(jours / 30)}m`;
    return `${(jours / 365).toFixed(1)}a`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Total actif</CardTitle>
          <Laptop className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground mt-1">attributions</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Par employé</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{parEmploye}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {total > 0 ? Math.round((parEmploye / total) * 100) : 0}% du total
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Par département</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{parDepartement}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {total > 0 ? Math.round((parDepartement / total) * 100) : 0}% du total
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Durée moyenne</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDuree(dureeeMoyenne)}</div>
          <p className="text-xs text-muted-foreground mt-1">possession</p>
        </CardContent>
      </Card>
    </div>
  );
}
