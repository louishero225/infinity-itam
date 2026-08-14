import { NextResponse } from "next/server";

import { requireUserApi } from "@/lib/auth/require-user-api";
import { rateLimit } from "@/lib/server/rate-limit";

export async function GET(request: Request) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;

  const limited = rateLimit(`search:${auth.user.id}`, 60);
  if (!limited.ok) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ materiels: [], employes: [], licences: [] });
  }

  const like = `%${q}%`;
  const supabase = auth.supabase;

  const [materiels, employes, licences] = await Promise.all([
    supabase
      .from("materiels")
      .select("id, code_materiel, type")
      .or(`code_materiel.ilike.${like},numero_serie.ilike.${like},marque.ilike.${like}`)
      .limit(8),
    supabase
      .from("employes")
      .select("id, prenom, nom, departement")
      .or(`prenom.ilike.${like},nom.ilike.${like},matricule.ilike.${like}`)
      .limit(8),
    supabase.from("licences").select("id, nom, editeur").ilike("nom", like).limit(6),
  ]);

  return NextResponse.json({
    materiels: materiels.data ?? [],
    employes: employes.data ?? [],
    licences: licences.data ?? [],
  });
}
