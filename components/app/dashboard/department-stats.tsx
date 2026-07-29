"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

type DepartmentStatsProps = {
  data: { departement: string | null; nombre_materiels: number | null }[];
};

export function DepartmentStats({ data }: DepartmentStatsProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-[200px] w-full" />;
  }

  const validData = data
    .filter((item) => item.departement && item.nombre_materiels != null)
    .map((item) => ({ departement: item.departement!, nombre_materiels: item.nombre_materiels! }))
    .sort((a, b) => b.nombre_materiels - a.nombre_materiels);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {validData.map((item) => (
        <div
          key={item.departement}
          className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-muted hover:border-blue-500/50 transition-all hover:shadow-md bg-gradient-to-br from-background to-blue-50/20 dark:to-blue-950/20"
        >
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {item.nombre_materiels}
          </div>
          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-300">
            {item.departement}
          </Badge>
        </div>
      ))}
      {validData.length === 0 && (
        <div className="col-span-full text-center text-muted-foreground py-8">
          Aucun département disponible
        </div>
      )}
    </div>
  );
}
