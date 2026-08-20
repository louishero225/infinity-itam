"use client";

import * as React from "react";
import { toast } from "sonner";

import { updateEmployeEmail } from "@/app/(app)/employes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmployeEmailField({
  employeId,
  initialEmail,
}: {
  employeId: string;
  initialEmail: string | null;
}) {
  const [email, setEmail] = React.useState(initialEmail ?? "");
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateEmployeEmail(employeId, email.trim() || null);
      toast.success("Email Microsoft enregistré — le portail Mes demandes pourra rattacher ses tickets.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <Label htmlFor="employe-email">Email Microsoft (portail)</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="employe-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom.nom@entreprise.com"
          className="sm:flex-1"
        />
        <Button type="button" variant="outline" onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Doit être identique à l&apos;adresse utilisée pour « Continuer avec Microsoft ».
      </p>
    </div>
  );
}
