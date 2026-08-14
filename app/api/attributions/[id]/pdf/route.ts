import { NextResponse } from "next/server";

import { requireUserApi } from "@/lib/auth/require-user-api";
import { buildFicheRemisePdf } from "@/lib/pdf/fiche-remise";
import { rateLimit } from "@/lib/server/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;

  const limited = rateLimit(`pdf:${auth.user.id}`, 20);
  if (!limited.ok) {
    return new NextResponse("Trop de requêtes", { status: 429 });
  }

  const { id } = await params;
  const { data: attribution, error } = await auth.supabase
    .from("attributions")
    .select(
      `
      numero_attribution,
      date_attribution,
      materiel:materiel_id (code_materiel, type, marque, modele, numero_serie),
      employe:employe_id (prenom, nom, departement),
      beneficiaire_label
    `
    )
    .eq("id", id)
    .single();

  if (error || !attribution) {
    return new NextResponse("Attribution introuvable", { status: 404 });
  }

  const materiel = Array.isArray(attribution.materiel)
    ? attribution.materiel[0]
    : attribution.materiel;
  const employe = Array.isArray(attribution.employe)
    ? attribution.employe[0]
    : attribution.employe;

  const buffer = buildFicheRemisePdf({
    numero_attribution: attribution.numero_attribution,
    date_attribution: attribution.date_attribution,
    code_materiel: materiel?.code_materiel ?? "N/A",
    type_materiel: materiel?.type ?? "N/A",
    marque: materiel?.marque,
    modele: materiel?.modele,
    numero_serie: materiel?.numero_serie,
    beneficiaire_nom: employe?.nom ?? attribution.beneficiaire_label ?? "N/A",
    beneficiaire_prenom: employe?.prenom,
    beneficiaire_departement: employe?.departement,
  });

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fiche-remise-${materiel?.code_materiel ?? id}.pdf"`,
    },
  });
}
