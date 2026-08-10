import type { ReactNode } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  href,
  accent = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  accent?: "default" | "accent" | "success" | "muted" | "warning" | "danger";
  className?: string;
}) {
  const valueClass = {
    default: "text-foreground",
    accent: "text-foreground",
    success: "text-emerald-700 dark:text-emerald-400",
    muted: "text-muted-foreground",
    warning: "text-amber-700 dark:text-amber-400",
    danger: "text-destructive",
  }[accent];

  const card = (
    <Card
      className={cn(
        "gap-0 py-0 transition-all duration-200",
        href && "hover:border-primary/30 hover:shadow-md cursor-pointer",
        className
      )}
    >
      <CardHeader className="px-5 pt-5 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className={cn("text-3xl font-semibold tabular-nums tracking-tight", valueClass)}>
          {value}
        </div>
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-transform duration-200 hover:scale-[1.01]">
        {card}
      </Link>
    );
  }

  return card;
}
