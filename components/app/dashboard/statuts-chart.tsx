"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  type PieLabelRenderProps,
} from "recharts";

type StatutsChartProps = {
  data: {
    statut: string;
    count: number;
    percentage: number;
  }[];
};

import { statutChartColors, chartTooltipStyle } from "@/lib/ui/chart-theme";

type TooltipPayload = {
  payload?: { percentage: number };
};

export function StatutsChart({ data }: StatutsChartProps) {
  const renderCustomLabel = ({
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent = 0,
  }: PieLabelRenderProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Répartition par statut</CardTitle>
        <p className="text-sm text-muted-foreground">État actuel du parc</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              nameKey="statut"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={statutChartColors[entry.statut] || "var(--chart-5)"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(
                value: number | undefined,
                name: string | undefined,
                props: TooltipPayload
              ) => [
                value
                  ? `${value} (${props.payload?.percentage.toFixed(1) ?? 0}%)`
                  : "0",
                name || "",
              ]}
              contentStyle={chartTooltipStyle}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
