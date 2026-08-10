import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/require-user-api";
type MaterielJoin = {
  code_materiel: string | null;
  type: string | null;
  marque: string | null;
  modele: string | null;
  numero_serie: string | null;
};

type AttributionWithMateriel = {
  numero_attribution: string | null;
  date_attribution: string;
  commentaire: string | null;
  materiels: MaterielJoin | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ employe_id: string }> }
) {
  try {
    const auth = await requireUserApi();
    if (auth.response) return auth.response;

    const supabase = auth.supabase;
    const { employe_id } = await params;

    // Récupérer les informations de l'employé
    const { data: employe, error: employeError } = await supabase
      .from("employes")
      .select("id, nom, prenom, departement")
      .eq("id", employe_id)
      .single();

    if (employeError || !employe) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer toutes les attributions actives de cet employé
    const { data: attributions, error: attributionsError } = await supabase
      .from("attributions")
      .select(`
        id,
        numero_attribution,
        date_attribution,
        commentaire,
        materiels (
          id,
          code_materiel,
          type,
          marque,
          modele,
          numero_serie
        )
      `)
      .eq("employe_id", employe_id)
      .eq("statut", "Actif")
      .order("date_attribution", { ascending: false });

    if (attributionsError) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération des attributions" },
        { status: 500 }
      );
    }

    // Formater les données pour la fiche groupée
    const numeros_attribution = attributions
      ?.map((a) => a.numero_attribution)
      .filter(Boolean) || [];

    const materiels = (attributions as unknown as AttributionWithMateriel[] | null)?.map((a) => ({
      code_materiel: a.materiels?.code_materiel || "",
      type_materiel: a.materiels?.type || "",
      marque: a.materiels?.marque || undefined,
      modele: a.materiels?.modele || undefined,
      numero_serie: a.materiels?.numero_serie || undefined,
      numero_attribution: a.numero_attribution || "",
    })) || [];

    const ficheData = {
      numeros_attribution,
      date_attribution: attributions?.[0]?.date_attribution || new Date().toISOString().split("T")[0],
      beneficiaire_nom: employe.nom,
      beneficiaire_prenom: employe.prenom,
      beneficiaire_departement: employe.departement,
      materiels,
      commentaire: attributions?.[0]?.commentaire || undefined,
    };

    return NextResponse.json(ficheData);
  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
