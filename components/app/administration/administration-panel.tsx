"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Download,
  Upload,
  Users,
  Bell,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

import {
  exportAttributionsCsv,
  exportEmployesCsv,
  exportMaterielsCsv,
  exportParcCompletCsv,
  generateGarantieAlertes,
} from "@/app/(app)/administration/actions";
import { mergeEmployes } from "@/app/(app)/employes/actions";
import type { EmployeDuplicateGroup } from "@/lib/utils/employe-matching";
import { employeDisplayName } from "@/lib/utils/employe-matching";
import { AlertDialogConfirm } from "@/components/ui/alert-dialog-confirm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

type Props = {
  duplicateGroups: EmployeDuplicateGroup[];
};

export function AdministrationPanel({ duplicateGroups }: Props) {
  const [importing, setImporting] = React.useState(false);
  const [dryRunResult, setDryRunResult] = React.useState<string | null>(null);
  const [mergeTargets, setMergeTargets] = React.useState<Record<string, string>>({});
  const [pendingMerge, setPendingMerge] = React.useState<{
    sourceId: string;
    targetId: string;
    label: string;
  } | null>(null);

  async function handleExport(fn: () => Promise<string>, filename: string) {
    try {
      const csv = await fn();
      download(filename, csv);
      toast.success(`Export ${filename} téléchargé`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur export");
    }
  }

  async function handleImport(execute: boolean) {
    const input = document.getElementById("inventaire-file") as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      toast.error("Sélectionnez un fichier Excel (.xlsx)");
      return;
    }

    setImporting(true);
    setDryRunResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("execute", execute ? "true" : "false");

      const res = await fetch("/api/admin/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import échoué");

      setDryRunResult(data.report ?? "Import terminé");
      toast.success(execute ? "Inventaire synchronisé" : "Simulation terminée — voir le rapport");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur import");
    } finally {
      setImporting(false);
    }
  }

  async function handleGenerateAlerts() {
    try {
      const { created } = await generateGarantieAlertes();
      toast.success(`${created} alerte(s) créée(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function confirmMerge() {
    if (!pendingMerge) return;
    const result = await mergeEmployes(pendingMerge.sourceId, pendingMerge.targetId);
    toast.success(`${result.merged} fusionné dans ${result.into}`);
    setPendingMerge(null);
    window.location.reload();
  }

  return (
    <>
      <Tabs defaultValue="export">
        <TabsList>
          <TabsTrigger value="export">Exports</TabsTrigger>
          <TabsTrigger value="import">Import Excel</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance ITAM</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="size-4" />
                Exporter les données
              </CardTitle>
              <CardDescription>Téléchargements CSV compatibles Excel</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleExport(exportParcCompletCsv, "parc-complet.csv")}>
                Parc complet
              </Button>
              <Button variant="outline" onClick={() => handleExport(exportMaterielsCsv, "materiels.csv")}>
                Matériels
              </Button>
              <Button variant="outline" onClick={() => handleExport(exportEmployesCsv, "employes.csv")}>
                Employés
              </Button>
              <Button variant="outline" onClick={() => handleExport(exportAttributionsCsv, "attributions.csv")}>
                Historique attributions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="size-4" />
                Synchroniser l&apos;inventaire Excel
              </CardTitle>
              <CardDescription>
                Fichier « Inventaire materiel IAG a jour.xlsx » — simulation obligatoire avant application
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label htmlFor="inventaire-file">Fichier .xlsx</Label>
                <input
                  id="inventaire-file"
                  type="file"
                  accept=".xlsx,.xls"
                  className="mt-2 block w-full text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={importing}
                  onClick={() => handleImport(false)}
                >
                  <Upload className="mr-2 size-4" />
                  {importing ? "Analyse…" : "Simuler (dry-run)"}
                </Button>
                <Button disabled={importing} onClick={() => handleImport(true)}>
                  <RefreshCw className="mr-2 size-4" />
                  Appliquer en base
                </Button>
              </div>
              {dryRunResult && (
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                  {dryRunResult}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="size-4" />
                Alertes automatiques
              </CardTitle>
              <CardDescription>
                Crée des alertes garantie (90 jours) et renouvellement licences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGenerateAlerts}>Générer les alertes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                Doublons employés ({duplicateGroups.length})
              </CardTitle>
              <CardDescription>Fusionner les fiches identifiées comme la même personne</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {duplicateGroups.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun doublon détecté.</p>
              ) : (
                duplicateGroups.map((group) => {
                  const groupKey = group.key;
                  const targetId = mergeTargets[groupKey] ?? group.members[0]?.id;
                  return (
                    <div key={groupKey} className="rounded-lg border p-4">
                      <p className="mb-3 text-sm font-medium">Groupe suspect</p>
                      <ul className="mb-3 space-y-1 text-sm">
                        {group.members.map((m) => (
                          <li key={m.id}>
                            {employeDisplayName(m.prenom, m.nom)}{" "}
                            <span className="text-muted-foreground">({m.departement})</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[220px]">
                          <Label>Fiche à conserver</Label>
                          <Select
                            value={targetId}
                            onValueChange={(v) =>
                              setMergeTargets((prev) => ({ ...prev, [groupKey]: v }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {group.members.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {employeDisplayName(m.prenom, m.nom)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {group.members
                          .filter((m) => m.id !== targetId)
                          .map((source) => (
                            <Button
                              key={source.id}
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                setPendingMerge({
                                  sourceId: source.id,
                                  targetId,
                                  label: `${employeDisplayName(source.prenom, source.nom)} → ${employeDisplayName(
                                    group.members.find((x) => x.id === targetId)!.prenom,
                                    group.members.find((x) => x.id === targetId)!.nom
                                  )}`,
                                })
                              }
                            >
                              Fusionner {employeDisplayName(source.prenom, source.nom)}
                            </Button>
                          ))}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialogConfirm
        open={!!pendingMerge}
        onOpenChange={(open) => !open && setPendingMerge(null)}
        onConfirm={confirmMerge}
        title="Confirmer la fusion"
        description={
          pendingMerge
            ? `Les attributions de « ${pendingMerge.label} » seront transférées. Cette action est irréversible.`
            : ""
        }
        confirmText="Fusionner"
        variant="destructive"
      />
    </>
  );
}
