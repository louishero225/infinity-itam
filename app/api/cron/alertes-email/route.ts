import { NextResponse } from "next/server";

import { parseAlertRecipients, sendEmail } from "@/lib/email/send";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const today = new Date();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 90);
  const horizonIso = horizon.toISOString().slice(0, 10);

  const { data: licences } = await supabase
    .from("licences")
    .select("id, nom, date_expiration")
    .not("date_expiration", "is", null)
    .lte("date_expiration", horizonIso);

  let created = 0;
  for (const l of licences ?? []) {
    const { data: dup } = await supabase
      .from("alertes")
      .select("id")
      .eq("licence_id", l.id)
      .eq("type", "renouvellement")
      .eq("statut", "active")
      .maybeSingle();
    if (dup) continue;
    const { error } = await supabase.from("alertes").insert({
      type: "renouvellement",
      titre: `Renouvellement licence — ${l.nom}`,
      description: `Licence ${l.nom} expire le ${l.date_expiration}`,
      priorite: "haute",
      date_echeance: l.date_expiration,
      licence_id: l.id,
      statut: "active",
    });
    if (!error) created++;
  }

  const { data: alertes } = await supabase
    .from("alertes")
    .select("titre, priorite, date_echeance")
    .eq("statut", "active")
    .limit(30);

  const { data: prets } = await supabase
    .from("attributions")
    .select("date_retour_prevue, materiel:materiel_id(code_materiel)")
    .eq("statut", "Actif")
    .eq("type_attribution", "pret")
    .lt("date_retour_prevue", today.toISOString().slice(0, 10));

  const recipients = parseAlertRecipients();
  const html = `
    <h1>Alertes ITAM</h1>
    <p>${created} nouvelle(s) alerte(s) générée(s).</p>
    <h2>Alertes actives</h2>
    <ul>${
      (alertes ?? [])
        .map((a) => `<li><strong>${a.titre}</strong> — ${a.priorite}</li>`)
        .join("") || "<li>Aucune</li>"
    }</ul>
    <h2>Prêts en retard</h2>
    <ul>${
      (prets ?? [])
        .map((p) => {
          const materiel = Array.isArray(p.materiel) ? p.materiel[0] : p.materiel;
          return `<li>${materiel?.code_materiel ?? "Matériel"} — ${p.date_retour_prevue}</li>`;
        })
        .join("") || "<li>Aucun</li>"
    }</ul>
  `;

  const email = await sendEmail({
    to: recipients,
    subject: `[ITAM] ${alertes?.length ?? 0} alerte(s) active(s)`,
    html,
  });

  return NextResponse.json({
    created,
    alertes: alertes?.length ?? 0,
    pretsEnRetard: prets?.length ?? 0,
    email,
  });
}
