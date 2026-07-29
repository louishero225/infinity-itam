"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type TcoDepartementChartProps = {
  data: {
    departement: string;
    cout_materiel: number;
    cout_licences: number;
    cout_reparations: number;
    total: number;
  }[];
};

export function TcoDepartementChart({ data }: TcoDepartementChartProps) {
  const formatMoney = (value: number | undefined) => {
    if (!value) return "0";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">TCO par département</CardTitle>
        <p className="text-sm text-muted-foreground">
          Matériel, licences et réparations
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="departement"
              stroke="#6b7280"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={formatMoney}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
              formatter={formatMoney}
            />
            <Legend />
            <Bar dataKey="cout_materiel" stackId="a" fill="#3b82f6" name="Matériel" />
            <Bar dataKey="cout_licences" stackId="a" fill="#10b981" name="Licences" />
            <Bar
              dataKey="cout_reparations"
              stackId="a"
              fill="#f59e0b"
              name="Réparations"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
