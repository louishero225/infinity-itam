"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

type CategoryStatsProps = {
  data: { type: string; nombre_materiels: number }[];
};

export function CategoryStats({ data }: CategoryStatsProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-[200px] w-full" />;
  }

  const sortedData = [...data].sort((a, b) => b.nombre_materiels - a.nombre_materiels);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {sortedData.map((item) => (
        <div
          key={item.type}
          className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-muted hover:border-primary/50 transition-all hover:shadow-md bg-gradient-to-br from-background to-muted/20"
        >
          <div className="text-4xl font-bold text-primary mb-2">
            {item.nombre_materiels}
          </div>
          <Badge variant="secondary" className="text-xs">
            {item.type}
          </Badge>
        </div>
      ))}
      {sortedData.length === 0 && (
        <div className="col-span-full text-center text-muted-foreground py-8">
          Aucune catégorie disponible
        </div>
      )}
    </div>
  );
}
