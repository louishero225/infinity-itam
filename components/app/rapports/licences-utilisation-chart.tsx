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
  Cell,
  LabelList,
} from "recharts";

type LicencesUtilisationChartProps = {
  data: {
    nom: string;
    utilisees: number;
    disponibles: number;
    taux: number;
  }[];
};

const getColor = (taux: number) => {
  if (taux >= 90) return "#ef4444"; // red
  if (taux >= 70) return "#f59e0b"; // amber
  return "#10b981"; // green
};

export function LicencesUtilisationChart({ data }: LicencesUtilisationChartProps) {
  const sortedData = [...data].sort((a, b) => b.taux - a.taux);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Utilisation des licences</CardTitle>
        <p className="text-sm text-muted-foreground">
          Taux d'utilisation par licence
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sortedData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={12} />
            <YAxis
              dataKey="nom"
              type="category"
              width={150}
              stroke="#6b7280"
              fontSize={11}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
              formatter={(value: any, name: any) => {
                if (name === "Taux") return `${value}%`;
                return value;
              }}
            />
            <Bar dataKey="taux" radius={[0, 4, 4, 0]} name="Taux">
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.taux)} />
              ))}
              <LabelList
                dataKey="taux"
                position="right"
                formatter={(value: any) => value ? `${Number(value).toFixed(0)}%` : ""}
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
