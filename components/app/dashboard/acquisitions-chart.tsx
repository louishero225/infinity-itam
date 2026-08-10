"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chartAxisStroke,
  chartColors,
  chartGridStroke,
  chartTooltipStyle,
} from "@/lib/ui/chart-theme";
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
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
            <XAxis
              dataKey="mois"
              stroke={chartAxisStroke}
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke={chartColors.primary}
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={chartColors.secondary}
              fontSize={12}
              tickLine={false}
              tickFormatter={formatMoney}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
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
              stroke={chartColors.primary}
              strokeWidth={2}
              dot={{ fill: chartColors.primary, r: 4 }}
              name="Quantité"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="valeur"
              stroke={chartColors.secondary}
              strokeWidth={2}
              dot={{ fill: chartColors.secondary, r: 4 }}
              name="Valeur"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
