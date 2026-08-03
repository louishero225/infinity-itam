"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createEntite, type EntiteRow } from "@/app/(app)/entites/actions";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BeneficiaireType } from "@/lib/utils/beneficiaire";

type Props = {
  entites: EntiteRow[];
  type?: BeneficiaireType;
  value?: string;
  onValueChange: (entiteId: string, entite: EntiteRow) => void;
  placeholder?: string;
};

export function EntiteSelect({
  entites,
  type,
  value,
  onValueChange,
  placeholder = "Choisir une entité",
}: Props) {
  const [localEntites, setLocalEntites] = React.useState(entites);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newNom, setNewNom] = React.useState("");
  const [newType, setNewType] = React.useState<BeneficiaireType>(type ?? "departement");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    setLocalEntites(entites);
  }, [entites]);

  const filtered = React.useMemo(
    () => (type ? localEntites.filter((e) => e.type === type) : localEntites),
    [localEntites, type]
  );

  const options: ComboboxOption[] = React.useMemo(
    () =>
      filtered.map((e) => ({
        value: e.id,
        label: `${e.nom} (${e.code})`,
        searchTerms: `${e.nom} ${e.code}`.toLowerCase(),
      })),
    [filtered]
  );

  async function handleCreate() {
    if (!newNom.trim()) {
      toast.error("Nom requis");
      return;
    }
    setCreating(true);
    try {
      const created = await createEntite({ nom: newNom.trim(), type: newType });
      setLocalEntites((prev) => [...prev, created].sort((a, b) => a.nom.localeCompare(b.nom)));
      onValueChange(created.id, created);
      setCreateOpen(false);
      setNewNom("");
      toast.success("Entité créée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Combobox
        className="flex-1"
        options={options}
        value={value}
        onValueChange={(id) => {
          const entite = localEntites.find((e) => e.id === id);
          if (entite) onValueChange(id, entite);
        }}
        placeholder={placeholder}
        searchPlaceholder="Rechercher une entité..."
        emptyMessage="Aucune entité trouvée."
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Créer une entité"
        onClick={() => {
          setNewType(type ?? "departement");
          setCreateOpen(true);
        }}
      >
        <Plus className="size-4" />
      </Button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle entité</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
                placeholder="Ex: IT, Comptabilité..."
              />
            </div>
            {!type && (
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as BeneficiaireType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="departement">Département</SelectItem>
                    <SelectItem value="societe">Société</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
