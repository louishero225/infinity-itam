"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TimelineAttributionsChartProps = {
  data: {
    mois: string;
    attributions: number;
    restitutions: number;
    actif: number;
  }[];
};

export function TimelineAttributionsChart({ data }: TimelineAttributionsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline des attributions</CardTitle>
        <p className="text-sm text-muted-foreground">
          12 derniers mois - Flux et stock actif
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="mois"
              stroke="#6b7280"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="attributions"
              fill="#10b981"
              name="Attributions"
            />
            <Bar
              yAxisId="left"
              dataKey="restitutions"
              fill="#ef4444"
              name="Restitutions"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="actif"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              name="Stock actif"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
