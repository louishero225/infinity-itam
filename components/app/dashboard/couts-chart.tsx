"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type CoutsChartProps = {
  data: {
    mois: string;
    achats: number;
    reparations: number;
  }[];
};

export function CoutsChart({ data }: CoutsChartProps) {
  const formatMoney = (value: number) => {
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
        <CardTitle className="text-base">Coûts mensuels</CardTitle>
        <p className="text-sm text-muted-foreground">
          Achats et réparations (6 derniers mois)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAchats" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorReparations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="mois"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              tickFormatter={formatMoney}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
              formatter={(value: number | undefined) => value ? formatMoney(value) : "0"}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="achats"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorAchats)"
              name="Achats"
            />
            <Area
              type="monotone"
              dataKey="reparations"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorReparations)"
              name="Réparations"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
