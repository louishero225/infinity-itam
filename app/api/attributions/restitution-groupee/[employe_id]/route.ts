import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ employe_id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { employe_id } = await params;

    // Récupérer les informations de l'employé
    const { data: employe, error: employeError } = await supabase
      .from("employes")
      .select("id, nom, prenom, departement")
      .eq("id", employe_id)
      .single();

    if (employeError || !employe) {
      return new NextResponse("Employé non trouvé", { status: 404 });
    }

    // Récupérer toutes les restitutions récentes de cet employé
    const { data: restitutions, error: restitutionsError } = await supabase
      .from("attributions")
      .select(`
        id,
        numero_attribution,
        date_attribution,
        date_restitution,
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
      .eq("statut", "Restitué")
      .not("date_restitution", "is", null)
      .order("date_restitution", { ascending: false })
      .limit(20);

    if (restitutionsError) {
      return new NextResponse("Erreur lors de la récupération des restitutions", {
        status: 500,
      });
    }

    if (!restitutions || restitutions.length === 0) {
      return new NextResponse("Aucune restitution trouvée", { status: 404 });
    }

    // Grouper par date de restitution pour identifier les restitutions groupées
    const dateRestitution = restitutions[0]?.date_restitution
      ? new Date(restitutions[0].date_restitution).toLocaleDateString("fr-FR")
      : new Date().toLocaleDateString("fr-FR");

    // Formater les numéros d'attribution
    const numeros = restitutions
      .map((r) => r.numero_attribution)
      .filter(Boolean)
      .join(", ");

    // Formater les matériels
    const materielsHTML = restitutions
      .map((r: any) => {
        const mat = r.materiels;
        if (!mat) return "";
        
        return `
          <div style="display: flex; align-items: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; background: white;">
            <input type="checkbox" checked style="width: 20px; height: 20px; margin-right: 12px;" />
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 4px;">
                ${mat.type || "N/A"}${mat.marque ? " - " + mat.marque : ""}${mat.modele ? " " + mat.modele : ""}
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                Code: ${mat.code_materiel || "N/A"} • S/N: ${mat.numero_serie || "N/A"}
              </div>
            </div>
            <div style="color: #2563eb; font-weight: 600; font-size: 13px;">
              ${r.numero_attribution || ""}
            </div>
          </div>
        `;
      })
      .join("");

    const commentaire = restitutions[0]?.commentaire || "Départ de l'employé";

    // Générer le HTML de la fiche
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fiche de Restitution Groupée</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f9fafb;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    .logo-box {
      width: 120px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .title-box {
      text-align: right;
      flex: 1;
      padding-left: 20px;
    }
    .title-box h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      line-height: 1.2;
      color: #1a1a1a;
    }
    .title-box .subtitle {
      color: #dc2626;
      font-size: 12px;
      margin-top: 5px;
      font-weight: 600;
    }
    .meta-info {
      text-align: right;
      font-size: 11px;
      color: #666;
      margin-top: 15px;
    }
    .meta-info strong { 
      color: #1a1a1a; 
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .section-icon {
      width: 24px;
      height: 24px;
      margin-right: 10px;
      color: #dc2626;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .info-value {
      font-size: 16px;
      color: #111827;
      font-weight: 500;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .alert-box p {
      color: #92400e;
      font-size: 14px;
      line-height: 1.6;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 40px;
    }
    .signature-box {
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      min-height: 120px;
    }
    .signature-title {
      font-weight: 700;
      color: #374151;
      margin-bottom: 40px;
      font-size: 14px;
    }
    .signature-line {
      border-top: 1px solid #9ca3af;
      margin-top: 10px;
      padding-top: 8px;
      font-size: 12px;
      color: #6b7280;
    }
    .footer {
      background: #f9fafb;
      padding: 16px 30px;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="page-header">
      <div class="logo-box">
        <img src="/IAG 11 - Copie.jpg" alt="Logo INFINITY" />
      </div>
      <div class="title-box">
        <h1>FICHE DE RESTITUTION<br>DE MATÉRIEL</h1>
        <div class="subtitle">Document officiel - Départ Employé</div>
        <div class="meta-info">
          <div><strong>N° Attribution:</strong> ${numeros}</div>
          <div><strong>Date:</strong> ${dateRestitution}</div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="alert-box">
        <p><strong>⚠️ Restitution groupée</strong> - Tous les matériels ont été restitués simultanément suite au départ de l'employé.</p>
      </div>

      <!-- Ancien Bénéficiaire -->
      <div class="section">
        <div class="section-title">
          <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          ANCIEN BÉNÉFICIAIRE
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Nom et Prénom</div>
            <div class="info-value">${employe.prenom} ${employe.nom}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Département</div>
            <div class="info-value">${employe.departement || "—"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date de Restitution</div>
            <div class="info-value">${dateRestitution}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Nombre de Matériels</div>
            <div class="info-value">${restitutions.length} équipement(s)</div>
          </div>
        </div>
      </div>

      ${commentaire ? `
      <div class="section">
        <div class="section-title">
          <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
          </svg>
          MOTIF
        </div>
        <div style="padding: 12px; background: #f9fafb; border-radius: 6px;">
          <p style="color: #374151; font-size: 14px;">${commentaire}</p>
        </div>
      </div>
      ` : ''}

      <!-- Matériels Restitués -->
      <div class="section">
        <div class="section-title">
          <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          MATÉRIELS RESTITUÉS
        </div>
        ${materielsHTML}
      </div>

      <!-- Signatures -->
      <div class="signatures">
        <div class="signature-box">
          <div class="signature-title">LE RESPONSABLE IT</div>
          <div style="height: 60px;"></div>
          <div class="signature-line">Signature et cachet</div>
          <div style="margin-top: 12px; font-size: 11px;">Date : __ / __ / 20__</div>
        </div>
        <div class="signature-box">
          <div class="signature-title">L'ANCIEN BÉNÉFICIAIRE</div>
          <div style="height: 60px;"></div>
          <div class="signature-line">Signature (pour restitution et décharge)</div>
          <div style="margin-top: 12px; font-size: 11px;">Date : __ / __ / 20__</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Ce document atteste de la remise officielle du matériel et engage la responsabilité du bénéficiaire.
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Erreur génération fiche:", error);
    return new NextResponse("Erreur serveur", { status: 500 });
  }
}
