"use client";

import { toast } from "sonner";

import { exportAttributionsCsv, exportMaterielsCsv } from "@/app/(app)/rapports/actions";
import { Button } from "@/components/ui/button";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={async () => {
          try {
            const csv = await exportMaterielsCsv();
            download("materiels.csv", csv);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur export");
          }
        }}
      >
        Export matériel (CSV)
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            const csv = await exportAttributionsCsv();
            download("attributions.csv", csv);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur export");
          }
        }}
      >
        Export historique (CSV)
      </Button>
    </div>
  );
}
