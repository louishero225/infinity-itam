import { requireUserApi } from "@/lib/auth/require-user-api";
import { rateLimit } from "@/lib/server/rate-limit";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;

  const limited = rateLimit(`fiche:${auth.user.id}`, 40);
  if (!limited.ok) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { id } = await params;
  const supabase = auth.supabase;

  const { data: attribution, error } = await supabase
    .from("attributions")
    .select(
      `
      id,
      numero_attribution,
      date_attribution,
      date_restitution,
      statut,
      etat_remise,
      etat_restitution,
      accessoires,
      commentaire,
      beneficiaire_type,
      beneficiaire_label,
      materiel:materiel_id (
        id,
        code_materiel,
        type,
        marque,
        modele,
        numero_serie
      ),
      employe:employe_id (
        id,
        prenom,
        nom,
        departement
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !attribution) {
    return NextResponse.json(
      { error: "Attribution non trouvée" },
      { status: 404 }
    );
  }

  // Formater les données pour les fiches
  const materiel = Array.isArray(attribution.materiel) ? attribution.materiel[0] : attribution.materiel;
  const employe = Array.isArray(attribution.employe) ? attribution.employe[0] : attribution.employe;

  const ficheData = {
    attribution_id: attribution.id,
    numero_attribution: attribution.numero_attribution,
    date_attribution: attribution.date_attribution,
    date_restitution: attribution.date_restitution,
    code_materiel: materiel?.code_materiel || "N/A",
    type_materiel: materiel?.type || "N/A",
    marque: materiel?.marque,
    modele: materiel?.modele,
    numero_serie: materiel?.numero_serie,
    etat_remise: attribution.etat_remise,
    etat_restitution: attribution.etat_restitution,
    accessoires: attribution.accessoires,
    commentaire: attribution.commentaire,
    beneficiaire_type: attribution.beneficiaire_type || "employe",
    beneficiaire_nom: employe?.nom || attribution.beneficiaire_label || "N/A",
    beneficiaire_prenom: employe?.prenom,
    beneficiaire_departement: employe?.departement,
  };

  return NextResponse.json(ficheData);
}
