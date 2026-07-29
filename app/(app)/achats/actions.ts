"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function genererNumeroDemandeAchat(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  
  const now = new Date();
  const annee = now.getFullYear();
  const mois = String(now.getMonth() + 1).padStart(2, "0");
  const prefixe = `DA-${annee}-${mois}`;

  // Récupérer toutes les demandes du mois en cours
  const { data, error } = await supabase
    .from("demandes_achat")
    .select("numero_demande")
    .like("numero_demande", `${prefixe}-%`)
    .order("numero_demande", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Erreur lors de la génération du numéro:", error);
    return `${prefixe}-001`;
  }

  // Si aucune demande ce mois-ci, commencer à 001
  if (!data || data.length === 0) {
    return `${prefixe}-001`;
  }

  // Extraire le numéro séquentiel du dernier numéro
  const dernierNumero = data[0].numero_demande;
  const match = dernierNumero.match(/-(\d{3})$/);
  
  if (match) {
    const dernierSeq = parseInt(match[1], 10);
    const nouveauSeq = dernierSeq + 1;
    return `${prefixe}-${String(nouveauSeq).padStart(3, "0")}`;
  }

  // Fallback si format inattendu
  return `${prefixe}-001`;
}

export async function createDemandeAchat(input: {
  numero_demande: string;
  materiel_description: string;
  type_materiel?: string;
  quantite?: number;
  prix_unitaire?: number;
  montant_total?: number;
  fournisseur?: string;
  devis_url?: string;
  justification?: string;
  statut?: string;
  priorite?: string;
  demandeur?: string;
  date_demande: string;
  notes?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("demandes_achat").insert({
    numero_demande: input.numero_demande,
    materiel_description: input.materiel_description,
    type_materiel: input.type_materiel ?? null,
    quantite: input.quantite ?? 1,
    prix_unitaire: input.prix_unitaire ?? null,
    montant_total: input.montant_total ?? null,
    fournisseur: input.fournisseur ?? null,
    devis_url: input.devis_url ?? null,
    justification: input.justification ?? null,
    statut: input.statut ?? "En attente",
    priorite: input.priorite ?? "Normale",
    demandeur: input.demandeur ?? null,
    date_demande: input.date_demande,
    notes: input.notes ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/achats");
}

export async function updateDemandeAchat(input: {
  id: string;
  numero_demande: string;
  materiel_description: string;
  type_materiel?: string;
  quantite?: number;
  prix_unitaire?: number;
  montant_total?: number;
  fournisseur?: string;
  devis_url?: string;
  justification?: string;
  statut?: string;
  priorite?: string;
  demandeur?: string;
  approbateur?: string;
  date_demande: string;
  date_approbation?: string;
  date_decaissement?: string;
  date_reception?: string;
  date_mise_production?: string;
  materiel_id?: string;
  notes?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("demandes_achat")
    .update({
      numero_demande: input.numero_demande,
      materiel_description: input.materiel_description,
      type_materiel: input.type_materiel ?? null,
      quantite: input.quantite ?? 1,
      prix_unitaire: input.prix_unitaire ?? null,
      montant_total: input.montant_total ?? null,
      fournisseur: input.fournisseur ?? null,
      devis_url: input.devis_url ?? null,
      justification: input.justification ?? null,
      statut: input.statut ?? "En attente",
      priorite: input.priorite ?? "Normale",
      demandeur: input.demandeur ?? null,
      approbateur: input.approbateur ?? null,
      date_demande: input.date_demande,
      date_approbation: input.date_approbation ?? null,
      date_decaissement: input.date_decaissement ?? null,
      date_reception: input.date_reception ?? null,
      date_mise_production: input.date_mise_production ?? null,
      materiel_id: input.materiel_id ?? null,
      notes: input.notes ?? null,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  revalidatePath("/achats");
}

export async function deleteDemandeAchat(id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("demandes_achat").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/achats");
}

export async function changerStatutDemande(id: string, nouveauStatut: string) {
  const supabase = await createSupabaseServerClient();

  const updates: any = { statut: nouveauStatut };

  // Auto-remplir les dates selon le statut
  const today = new Date().toISOString().slice(0, 10);
  if (nouveauStatut === "Approuvée") {
    updates.date_approbation = today;
  } else if (nouveauStatut === "Décaissée") {
    updates.date_decaissement = today;
  } else if (nouveauStatut === "Réceptionnée") {
    updates.date_reception = today;
    
    // Créer automatiquement le matériel dans le stock
    const { data: demande } = await supabase
      .from("demandes_achat")
      .select("*")
      .eq("id", id)
      .single();

    if (demande && !demande.materiel_id) {
      // Générer un code matériel unique
      const prefix = demande.type_materiel?.substring(0, 3).toUpperCase() || "MAT";
      const timestamp = Date.now().toString().slice(-6);
      const codeMateriel = `${prefix}-${timestamp}`;

      // Créer le matériel
      const { data: nouveauMateriel, error: materielError } = await supabase
        .from("materiels")
        .insert({
          code_materiel: codeMateriel,
          type: demande.type_materiel || "Autre",
          statut: "Stock",
          date_achat: demande.date_reception || today,
          cout: demande.montant_total,
          observations: `Créé automatiquement depuis demande d'achat ${demande.numero_demande}`,
        })
        .select()
        .single();

      if (!materielError && nouveauMateriel) {
        // Lier le matériel à la demande d'achat
        updates.materiel_id = nouveauMateriel.id;
      }
    }
  } else if (nouveauStatut === "En production") {
    updates.date_mise_production = today;
  }

  const { error } = await supabase.from("demandes_achat").update(updates).eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/achats");
  revalidatePath("/materiels");
  revalidatePath("/dashboard");
}
