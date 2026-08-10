"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chartAxisStroke,
  chartColors,
  chartGridStroke,
  chartTooltipStyle,
} from "@/lib/ui/chart-theme";
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
                <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorReparations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.quaternary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartColors.quaternary} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
            <XAxis
              dataKey="mois"
              stroke={chartAxisStroke}
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke={chartAxisStroke}
              fontSize={12}
              tickLine={false}
              tickFormatter={formatMoney}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value: number | undefined) => value ? formatMoney(value) : "0"}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="achats"
              stroke={chartColors.primary}
              fillOpacity={1}
              fill="url(#colorAchats)"
              name="Achats"
            />
            <Area
              type="monotone"
              dataKey="reparations"
              stroke={chartColors.quaternary}
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
