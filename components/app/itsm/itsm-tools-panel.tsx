"use client";

import * as React from "react";
import { toast } from "sonner";
import { Link2, Upload, UserPlus } from "lucide-react";

import {
  generateOnboardingTickets,
  importManageEngineCsv,
  saveFaitsMarquants,
  syncPersonnesWithEmployes,
} from "@/app/(app)/itsm/actions";
import { ITSM_ENTITES } from "@/lib/itsm/constants";
import { todayDateStr } from "@/lib/itsm/sla";
import { employeDisplayName } from "@/lib/utils/employe-matching";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Employe = {
  id: string;
  prenom: string;
  nom: string;
  departement: string;
};

type Props = {
  canWrite: boolean;
  initialFaits: string;
  employes: Employe[];
};

export function ItsmToolsPanel({ canWrite, initialFaits, employes }: Props) {
  const [faits, setFaits] = React.useState(initialFaits);
  const [importing, setImporting] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setFaits(initialFaits);
  }, [initialFaits]);

  function scheduleFaitsSave(value: string) {
    if (!canWrite) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveFaitsMarquants(value);
        toast.success("Faits marquants enregistrés");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
      }
    }, 600);
  }

  async function handleSyncPersonnes() {
    setSyncing(true);
    try {
      const result = await syncPersonnesWithEmployes();
      toast.success(
        `${result.ticketsUpdated} ticket(s) aligné(s), ${result.demandeursMatched} demandeur(s) rapproché(s)`
      );
      if (result.unmatchedCount > 0) {
        toast.message(`${result.unmatchedCount} nom(s) sans correspondance ITAM`);
      }
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Synchronisation impossible");
    } finally {
      setSyncing(false);
    }
  }

  async function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setImporting(true);
    try {
      const result = await importManageEngineCsv(formData);
      toast.success(`${result.imported} ticket(s) importé(s)`);
      form.reset();
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import impossible");
    } finally {
      setImporting(false);
    }
  }

  async function handleOnboarding(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setGenerating(true);
    try {
      const result = await generateOnboardingTickets(formData);
      toast.success(`${result.created} tickets onboarding créés`);
      e.currentTarget.reset();
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  }

  if (!canWrite) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="size-4" />
            Uniformisation des personnes
          </CardTitle>
          <CardDescription>
            Rapproche les demandeurs ITSM avec les employés ITAM (noms canoniques Prénom NOM).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={handleSyncPersonnes} disabled={syncing}>
            {syncing ? "Synchronisation…" : "Rapprocher avec les employés ITAM"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="size-4" />
            Import ManageEngine (.csv)
          </CardTitle>
          <CardDescription>
            Déduplication par Request ID + rapprochement employés automatique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImport} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1 space-y-2">
              <Label htmlFor="csv-file">Fichier CSV</Label>
              <Input id="csv-file" name="file" type="file" accept=".csv" required />
            </div>
            <Button type="submit" disabled={importing}>
              {importing ? "Import…" : "Importer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="size-4" />
            Modèle onboarding
          </CardTitle>
          <CardDescription>Génère 7 tickets type pour un nouvel arrivant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" variant="outline" onClick={() => setShowOnboarding((v) => !v)}>
            {showOnboarding ? "Fermer" : "Utiliser ce modèle"}
          </Button>
          {showOnboarding ? (
            <form onSubmit={handleOnboarding} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ob_employe_id">Collaborateur (ITAM)</Label>
                <select
                  id="ob_employe_id"
                  name="ob_employe_id"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  onChange={(e) => {
                    const opt = e.target.selectedOptions[0];
                    const nomInput = document.getElementById("ob_nom") as HTMLInputElement | null;
                    if (nomInput && opt?.dataset.label) nomInput.value = opt.dataset.label;
                  }}
                >
                  <option value="">— Choisir —</option>
                  {employes.map((e) => (
                    <option
                      key={e.id}
                      value={e.id}
                      data-label={employeDisplayName(e.prenom, e.nom)}
                    >
                      {employeDisplayName(e.prenom, e.nom)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ob_nom">Nom (auto ou saisie)</Label>
                <Input id="ob_nom" name="ob_nom" required placeholder="Prénom NOM" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob_entite">Entité</Label>
                <select
                  id="ob_entite"
                  name="ob_entite"
                  defaultValue="IAG"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ITSM_ENTITES.map((ent) => (
                    <option key={ent} value={ent}>
                      {ent}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob_date">Date de début</Label>
                <Input
                  id="ob_date"
                  name="ob_date"
                  type="date"
                  defaultValue={todayDateStr()}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={generating}>
                  {generating ? "Génération…" : "Générer les 7 tickets"}
                </Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Faits marquants du jour</CardTitle>
          <CardDescription>Sauvegarde automatique.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={faits}
            onChange={(e) => {
              setFaits(e.target.value);
              scheduleFaitsSave(e.target.value);
            }}
            rows={4}
            placeholder="Rien à signaler de particulier aujourd'hui."
          />
        </CardContent>
      </Card>
    </div>
  );
}
