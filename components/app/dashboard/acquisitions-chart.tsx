"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type AcquisitionsChartProps = {
  data: {
    mois: string;
    count: number;
    valeur: number;
  }[];
};

export function AcquisitionsChart({ data }: AcquisitionsChartProps) {
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
        <CardTitle className="text-base">Évolution des acquisitions</CardTitle>
        <p className="text-sm text-muted-foreground">6 derniers mois</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="mois"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="#3b82f6"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#10b981"
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
              formatter={(value: number | undefined, name: string | undefined) => {
                if (!value) return ["0", name || ""];
                if (name === "Valeur") return formatMoney(value);
                return [value, name || ""];
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              name="Quantité"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="valeur"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
              name="Valeur"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
