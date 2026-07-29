"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Item = {
  departement: string | null;
  nombre_materiels: number | null;
};

export function DepartmentChart({ data }: { data: Item[] }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = React.useMemo(
    () =>
      data
        .filter((d) => d.departement)
        .map((d) => ({
          departement: d.departement as string,
          nombre_materiels: d.nombre_materiels ?? 0,
        })),
    [data]
  );

  if (!mounted) {
    return <div className="h-[280px] w-full" />;
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="departement" tick={{ fontSize: 12 }} interval={0} angle={-20} height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="nombre_materiels" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
