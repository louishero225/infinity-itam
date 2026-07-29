"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Badge } from "@/components/ui/badge";

export function AlertesBadge() {
  const [count, setCount] = React.useState<number>(0);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchAlertes() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { count: alertesCount, error } = await supabase
          .from("alertes")
          .select("*", { count: "exact", head: true })
          .eq("statut", "active");

        if (error) throw error;
        if (!cancelled) setCount(alertesCount ?? 0);
      } catch (error) {
        console.error("Error fetching alertes count:", error);
      }
    }

    fetchAlertes();

    // Refresh every 5 minutes
    const interval = setInterval(fetchAlertes, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (count === 0) return null;

  return (
    <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-xs">
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
