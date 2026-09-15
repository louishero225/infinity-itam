"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { importFlotteFromForm } from "@/app/(app)/flotte/actions";
import { Button } from "@/components/ui/button";

export function FlotteImportPanel({ canWrite }: { canWrite: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  if (!canWrite) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    try {
      const res = await importFlotteFromForm(fd);
      toast.success(
        `Import terminé : ${res.inserted} créés, ${res.updated} MAJ, ${res.matched} liés ITAM`
      );
      if (res.unmatched.length > 0) {
        toast.message(`${res.unmatched.length} titulaire(s) non liés à un employé ITAM`);
      }
      router.refresh();
      e.currentTarget.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import impossible");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/20 p-4 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Importer le fichier Excel flotte</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Format « Liste Attributions Numeros Flotte » — départements, noms, numéros 07…
        </p>
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls"
          required
          className="mt-2 block w-full text-sm"
        />
      </div>
      <Button type="submit" disabled={pending} className="gap-2 shrink-0">
        <Upload className="size-4" />
        {pending ? "Import…" : "Importer"}
      </Button>
    </form>
  );
}
