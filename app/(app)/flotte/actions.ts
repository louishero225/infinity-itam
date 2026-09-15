"use server";

import { revalidatePath } from "next/cache";

import { requireWrite } from "@/lib/auth/roles";
import { logAudit } from "@/lib/server/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEMANDE_ORANGE_STATUTS,
  FLOTTE_FORFAITS,
  FLOTTE_FORMULES,
  FLOTTE_STATUTS,
  type DemandeOrangeStatut,
  type FlotteFormule,
  type FlotteStatut,
} from "@/lib/flotte/constants";
import { formatPhoneDisplay, normalizePhoneDigits } from "@/lib/flotte/phone-utils";
import { matchEmployeFromLabel } from "@/lib/itsm/person-matching";

export type NumeroFlotteRow = {
  id: string;
  numero: string;
  numero_normalise: string;
  statut: FlotteStatut;
  operateur: string;
  employe_id: string | null;
  titulaire_libre: string | null;
  fonction: string | null;
  departement: string | null;
  date_attribution: string | null;
  date_liberation: string | null;
  demande_orange_id: string | null;
  formule: FlotteFormule | null;
  montant_ht: number | null;
  montant_ttc: number | null;
  notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  employe?: { id: string; prenom: string; nom: string; departement: string } | null;
};

export type DemandeOrangeRow = {
  id: string;
  reference_orange: string | null;
  statut: DemandeOrangeStatut;
  quantite: number;
  motif: string | null;
  demandeur_interne: string | null;
  date_demande: string;
  date_livraison_prevue: string | null;
  date_livraison_effective: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  numeros_count?: number;
};

async function listEmployes() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("employes")
    .select("id, prenom, nom, departement")
    .order("nom");
  return data ?? [];
}

async function closeHistorique(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, numeroId: string) {
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from("numeros_flotte_historique")
    .update({ date_fin: today })
    .eq("numero_flotte_id", numeroId)
    .is("date_fin", null);
}

async function openHistorique(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  args: {
    numeroId: string;
    employe_id: string | null;
    titulaire_libre: string | null;
    departement: string | null;
    fonction: string | null;
    date_debut: string;
    motif?: string;
  }
) {
  await supabase.from("numeros_flotte_historique").insert({
    numero_flotte_id: args.numeroId,
    employe_id: args.employe_id,
    titulaire_libre: args.titulaire_libre,
    departement: args.departement,
    fonction: args.fonction,
    date_debut: args.date_debut,
    motif: args.motif ?? null,
  });
}

export async function listNumerosFlotte() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("numeros_flotte")
    .select(
      `
      *,
      employe:employes!employe_id ( id, prenom, nom, departement )
    `
    )
    .order("departement", { ascending: true })
    .order("numero_normalise", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as NumeroFlotteRow[];
}

export async function listDemandesOrange() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("demandes_flotte_orange")
    .select("*")
    .order("date_demande", { ascending: false });

  if (error) throw new Error(error.message);

  const demandes = data ?? [];
  const { data: counts } = await supabase.from("numeros_flotte").select("demande_orange_id");

  const byDemande = new Map<string, number>();
  for (const row of counts ?? []) {
    if (!row.demande_orange_id) continue;
    byDemande.set(row.demande_orange_id, (byDemande.get(row.demande_orange_id) ?? 0) + 1);
  }

  return demandes.map((d) => ({
    ...d,
    numeros_count: byDemande.get(d.id) ?? 0,
  })) as DemandeOrangeRow[];
}

export async function upsertNumeroFlotte(input: {
  id?: string;
  numero: string;
  statut?: FlotteStatut;
  employe_id?: string | null;
  titulaire_libre?: string | null;
  fonction?: string | null;
  departement?: string | null;
  date_attribution?: string | null;
  formule?: FlotteFormule | null;
  notes?: string | null;
  demande_orange_id?: string | null;
}) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();

  const normalise = normalizePhoneDigits(input.numero);
  if (!normalise) throw new Error("Numéro invalide (attendu 07 XX XX XX XX).");

  const display = formatPhoneDisplay(normalise);
  const statut = input.statut ?? "attribue";
  const today = new Date().toISOString().slice(0, 10);

  const formule =
    input.formule && (FLOTTE_FORMULES as readonly string[]).includes(input.formule)
      ? input.formule
      : null;
  const forfait = formule ? FLOTTE_FORFAITS[formule] : null;

  const payload = {
    numero: display,
    numero_normalise: normalise,
    statut,
    employe_id: input.employe_id || null,
    titulaire_libre: input.titulaire_libre?.trim() || null,
    fonction: input.fonction?.trim() || null,
    departement: input.departement?.trim() || null,
    date_attribution: input.date_attribution || (statut === "attribue" ? today : null),
    date_liberation: statut === "disponible" ? today : null,
    formule,
    montant_ht: forfait?.montant_ht ?? null,
    montant_ttc: forfait?.montant_ttc ?? null,
    notes: input.notes?.trim() || null,
    demande_orange_id: input.demande_orange_id || null,
  };

  if (input.id) {
    const { data: existing } = await supabase
      .from("numeros_flotte")
      .select("employe_id, titulaire_libre, departement, fonction")
      .eq("id", input.id)
      .maybeSingle();

    const changed =
      existing &&
      (existing.employe_id !== payload.employe_id ||
        existing.titulaire_libre !== payload.titulaire_libre ||
        existing.departement !== payload.departement);

    if (changed && statut === "attribue") {
      await closeHistorique(supabase, input.id);
      await openHistorique(supabase, {
        numeroId: input.id,
        employe_id: payload.employe_id,
        titulaire_libre: payload.titulaire_libre,
        departement: payload.departement,
        fonction: payload.fonction,
        date_debut: payload.date_attribution ?? today,
        motif: "Réattribution",
      });
    }

    const { error } = await supabase.from("numeros_flotte").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);

    await logAudit({
      action: "flotte.numero.update",
      entityType: "numeros_flotte",
      entityId: input.id,
      details: payload,
    });
  } else {
    const { data, error } = await supabase
      .from("numeros_flotte")
      .insert({ ...payload, source: "saisie" })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Insertion impossible.");

    if (statut === "attribue" && (payload.employe_id || payload.titulaire_libre)) {
      await openHistorique(supabase, {
        numeroId: data.id,
        employe_id: payload.employe_id,
        titulaire_libre: payload.titulaire_libre,
        departement: payload.departement,
        fonction: payload.fonction,
        date_debut: payload.date_attribution ?? today,
        motif: "Attribution initiale",
      });
    }

    await logAudit({
      action: "flotte.numero.create",
      entityType: "numeros_flotte",
      entityId: data.id,
      details: payload,
    });
  }

  revalidatePath("/flotte");
}

export async function libererNumeroFlotte(id: string, motif?: string) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  await closeHistorique(supabase, id);

  const { error } = await supabase
    .from("numeros_flotte")
    .update({
      statut: "disponible",
      employe_id: null,
      titulaire_libre: null,
      fonction: null,
      date_liberation: today,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logAudit({
    action: "flotte.numero.liberer",
    entityType: "numeros_flotte",
    entityId: id,
    details: { motif },
  });

  revalidatePath("/flotte");
}

export async function deleteNumeroFlotte(id: string) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("numeros_flotte").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/flotte");
}

export async function upsertDemandeOrange(input: {
  id?: string;
  reference_orange?: string | null;
  statut?: DemandeOrangeStatut;
  quantite?: number;
  motif?: string | null;
  demandeur_interne?: string | null;
  date_demande?: string;
  date_livraison_prevue?: string | null;
  date_livraison_effective?: string | null;
  notes?: string | null;
}) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();

  const statut = input.statut ?? "brouillon";
  if (!DEMANDE_ORANGE_STATUTS.includes(statut)) throw new Error("Statut invalide.");

  const payload = {
    reference_orange: input.reference_orange?.trim() || null,
    statut,
    quantite: input.quantite ?? 1,
    motif: input.motif?.trim() || null,
    demandeur_interne: input.demandeur_interne?.trim() || null,
    date_demande: input.date_demande || new Date().toISOString().slice(0, 10),
    date_livraison_prevue: input.date_livraison_prevue || null,
    date_livraison_effective:
      statut === "livree"
        ? input.date_livraison_effective || new Date().toISOString().slice(0, 10)
        : input.date_livraison_effective || null,
    notes: input.notes?.trim() || null,
  };

  if (input.id) {
    const { error } = await supabase.from("demandes_flotte_orange").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("demandes_flotte_orange").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/flotte");
}

export async function deleteDemandeOrange(id: string) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("demandes_flotte_orange").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/flotte");
}

/** Import Excel « Liste Attributions Numeros Flotte » */
export async function importFlotteFromForm(formData: FormData) {
  await requireWrite();
  const XLSX = await import("xlsx");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Fichier Excel manquant.");
  }

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames.find((n) => /flotte|num/i.test(n)) ?? wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
  });

  let departement = "";
  const items: {
    departement: string;
    titulaire: string;
    fonction: string;
    numero: string;
  }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const [colDept, colNom, colFonction, colNumero] = row;
    if (colDept && !colNom && !colNumero) {
      departement = String(colDept).trim();
      continue;
    }
    const nom = String(colNom ?? "").trim();
    const numero = String(colNumero ?? "").trim();
    if (!nom || !numero) continue;
    items.push({
      departement,
      titulaire: nom,
      fonction: String(colFonction ?? "").trim(),
      numero,
    });
  }

  if (items.length === 0) throw new Error("Aucune ligne d'attribution trouvée dans le fichier.");

  const supabase = await createSupabaseServerClient();
  const employes = await listEmployes();
  const today = new Date().toISOString().slice(0, 10);

  let inserted = 0;
  let updated = 0;
  let matched = 0;
  const unmatched: string[] = [];

  for (const item of items) {
    const normalise = normalizePhoneDigits(item.numero);
    if (!normalise) continue;

    const match = matchEmployeFromLabel(item.titulaire, employes);
    if (match) matched++;
    else unmatched.push(item.titulaire);

    const payload = {
      numero: formatPhoneDisplay(normalise),
      numero_normalise: normalise,
      statut: "attribue" as const,
      operateur: "Orange",
      employe_id: match?.id ?? null,
      titulaire_libre: match ? null : item.titulaire,
      fonction: item.fonction || null,
      departement: item.departement || match?.departement || null,
      date_attribution: today,
      date_liberation: null,
      source: "import",
    };

    const { data: existing } = await supabase
      .from("numeros_flotte")
      .select("id, employe_id, titulaire_libre")
      .eq("numero_normalise", normalise)
      .maybeSingle();

    if (existing) {
      await closeHistorique(supabase, existing.id);
      await supabase.from("numeros_flotte").update(payload).eq("id", existing.id);
      await openHistorique(supabase, {
        numeroId: existing.id,
        employe_id: payload.employe_id,
        titulaire_libre: payload.titulaire_libre,
        departement: payload.departement,
        fonction: payload.fonction,
        date_debut: today,
        motif: "Import Excel",
      });
      updated++;
    } else {
      const { data: created } = await supabase
        .from("numeros_flotte")
        .insert(payload)
        .select("id")
        .maybeSingle();
      if (created) {
        await openHistorique(supabase, {
          numeroId: created.id,
          employe_id: payload.employe_id,
          titulaire_libre: payload.titulaire_libre,
          departement: payload.departement,
          fonction: payload.fonction,
          date_debut: today,
          motif: "Import Excel",
        });
        inserted++;
      }
    }
  }

  await logAudit({
    action: "flotte.import",
    entityType: "numeros_flotte",
    details: { inserted, updated, matched, total: items.length },
  });

  revalidatePath("/flotte");

  return {
    inserted,
    updated,
    matched,
    total: items.length,
    unmatched: [...new Set(unmatched)],
  };
}

export async function listEmployesForFlotte() {
  return listEmployes();
}
