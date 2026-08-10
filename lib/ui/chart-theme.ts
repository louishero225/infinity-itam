export const chartColors = {
  primary: "var(--chart-1)",
  secondary: "var(--chart-2)",
  tertiary: "var(--chart-3)",
  quaternary: "var(--chart-4)",
  quinary: "var(--chart-5)",
} as const;

export const chartTooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--popover-foreground)",
} as const;

export const chartGridStroke = "var(--border)";
export const chartAxisStroke = "var(--muted-foreground)";

export const statutChartColors: Record<string, string> = {
  Stock: "var(--chart-2)",
  Attribué: "var(--chart-1)",
  Maintenance: "var(--chart-4)",
  Transit: "var(--chart-5)",
};
