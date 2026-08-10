"use client";

import { useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Printer } from "lucide-react";
import { MaterielIcon } from "@/lib/utils/materiel-icons";

type FicheData = {
  attribution_id: string;
  numero_attribution?: string;
  date_attribution: string;
  date_restitution?: string;
  code_materiel: string;
  type_materiel: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  etat_restitution?: string;
  commentaire?: string;
  beneficiaire_nom: string;
  beneficiaire_prenom?: string;
  beneficiaire_departement?: string;
  beneficiaire_type: string;
  checklist_items?: string[];
  decision_it?: "bon_etat" | "avec_reserves" | "reparation" | "reformer";
};

export function FicheReceptionMateriel({ data }: { data: FicheData }) {
  const ficheRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (ficheRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Fiche de Réception de Matériel - ${data.code_materiel}</title>
              <style>
                @page { size: A4; margin: 15mm; }
                * { box-sizing: border-box; }
                body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.5; 
                  color: #1a1a1a;
                  margin: 0;
                  padding: 30px;
                  background: white;
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
                }
                .title-box .subtitle {
                  color: #2563eb;
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
                .meta-info strong { color: #1a1a1a; }
                .section {
                  margin-bottom: 18px;
                  page-break-inside: avoid;
                }
                .section-header {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  color: #2563eb;
                  font-weight: 700;
                  font-size: 13px;
                  text-transform: uppercase;
                  margin-bottom: 10px;
                  padding-bottom: 6px;
                  border-bottom: 2px solid #e5e7eb;
                }
                .section-icon:not(.section-icon-graphic) {
                  width: 6px;
                  height: 6px;
                  border-radius: 1px;
                  background: currentColor;
                  flex-shrink: 0;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 12px;
                  background: #f9fafb;
                  padding: 15px;
                  border-radius: 4px;
                  border: 1px solid #e5e7eb;
                }
                .info-item {
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                }
                .info-label {
                  font-size: 11px;
                  text-transform: uppercase;
                  color: #6b7280;
                  font-weight: 600;
                  letter-spacing: 0.5px;
                }
                .info-value {
                  font-size: 13px;
                  color: #1a1a1a;
                  font-weight: 600;
                }
                .full-width {
                  grid-column: 1 / -1;
                }
                .checklist {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 8px;
                  background: #dbeafe;
                  padding: 12px;
                  border-radius: 4px;
                  border: 1px solid #60a5fa;
                }
                .checklist-item {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 11px;
                  color: #1e40af;
                }
                .checkbox {
                  width: 14px;
                  height: 14px;
                  border: 2px solid #1e40af;
                  display: inline-block;
                  flex-shrink: 0;
                  border-radius: 2px;
                }
                .signatures-container {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-top: 25px;
                  page-break-inside: avoid;
                }
                .signature-block {
                  text-align: center;
                }
                .signature-title {
                  font-size: 11px;
                  text-transform: uppercase;
                  color: #6b7280;
                  font-weight: 600;
                  margin-bottom: 15px;
                }
                .signature-area {
                  border: 1px solid #d1d5db;
                  height: 70px;
                  margin-bottom: 8px;
                  background: #fafafa;
                  display: flex;
                  align-items: flex-end;
                  justify-content: center;
                  color: #9ca3af;
                  font-size: 10px;
                  font-style: italic;
                  padding-bottom: 5px;
                }
                .signature-date {
                  font-size: 11px;
                  color: #6b7280;
                }
                .footer {
                  margin-top: 20px;
                  padding-top: 10px;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  font-size: 8px;
                  color: #9ca3af;
                }
                .notes-box {
                  border: 1px solid #e5e7eb;
                  padding: 10px;
                  min-height: 50px;
                  background: #f9fafb;
                  border-radius: 4px;
                  font-size: 11px;
                  color: #374151;
                }
                @media print {
                  body { padding: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${ficheRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1" />
          Fiche réception
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fiche de Réception de Matériel (Restitution)</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-end mb-4 no-print">
          <Button onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>

        <div ref={ficheRef} className="bg-white">
          <div className="page-header">
            <div className="logo-box">
              <Image
                src="/IAG 11 - Copie.jpg"
                alt="Logo entreprise"
                width={120}
                height={50}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="title-box">
              <h1>FICHE DE RESTITUTION<br/>DE MATÉRIEL</h1>
              <div className="subtitle">Document officiel de restitution et contrôle</div>
              <div className="meta-info">
                <div><strong>N° Attribution :</strong> {data.numero_attribution || data.attribution_id}</div>
                <div><strong>Date restitution :</strong> {data.date_restitution 
                  ? new Date(data.date_restitution).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "À compléter"}</div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-icon" aria-hidden="true" />
              <span>RESTITUÉ PAR</span>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Nom & Prénom</div>
                <div className="info-value">
                  {data.beneficiaire_type === "employe" 
                    ? `${data.beneficiaire_prenom || ""} ${data.beneficiaire_nom}`.trim()
                    : data.beneficiaire_nom}
                </div>
              </div>
              {data.beneficiaire_departement && (
                <div className="info-item">
                  <div className="info-label">Département</div>
                  <div className="info-value">{data.beneficiaire_departement}</div>
                </div>
              )}
              <div className="info-item">
                <div className="info-label">Date attribution initiale</div>
                <div className="info-value">
                  {new Date(data.date_attribution).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-icon section-icon-graphic">
                <MaterielIcon type={data.type_materiel} className="h-5 w-5" />
              </span>
              <span>MATÉRIEL RESTITUÉ</span>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Code Matériel</div>
                <div className="info-value">{data.code_materiel}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Type / Marque</div>
                <div className="info-value">{data.type_materiel}{data.marque ? ` - ${data.marque}` : ""}</div>
              </div>
              {data.modele && (
                <div className="info-item">
                  <div className="info-label">Modèle</div>
                  <div className="info-value">{data.modele}</div>
                </div>
              )}
              {data.numero_serie && (
                <div className="info-item">
                  <div className="info-label">Numéro de série</div>
                  <div className="info-value">{data.numero_serie}</div>
                </div>
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-icon" aria-hidden="true" />
              <span>CONTRÔLE DE L&apos;ÉTAT DU MATÉRIEL</span>
            </div>
            <div className="checklist">
              <div className="checklist-item">
                <span className="checkbox" style={data.checklist_items?.includes("Appareil complet et fonctionnel") ? { background: "#2563eb", position: "relative" } : {}}>
                  {data.checklist_items?.includes("Appareil complet et fonctionnel") && (
                    <span style={{ position: "absolute", top: "-2px", left: "2px", color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                  )}
                </span>
                <span>Appareil complet et fonctionnel</span>
              </div>
              <div className="checklist-item">
                <span className="checkbox" style={data.checklist_items?.includes("Écran intact sans rayures") ? { background: "#2563eb", position: "relative" } : {}}>
                  {data.checklist_items?.includes("Écran intact sans rayures") && (
                    <span style={{ position: "absolute", top: "-2px", left: "2px", color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                  )}
                </span>
                <span>Écran intact sans rayures</span>
              </div>
              <div className="checklist-item">
                <span className="checkbox" style={data.checklist_items?.includes("Clavier/Souris fonctionnels") ? { background: "#2563eb", position: "relative" } : {}}>
                  {data.checklist_items?.includes("Clavier/Souris fonctionnels") && (
                    <span style={{ position: "absolute", top: "-2px", left: "2px", color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                  )}
                </span>
                <span>Clavier/Souris fonctionnels</span>
              </div>
              <div className="checklist-item">
                <span className="checkbox" style={data.checklist_items?.includes("Boîtier/Coque sans dommages") ? { background: "#2563eb", position: "relative" } : {}}>
                  {data.checklist_items?.includes("Boîtier/Coque sans dommages") && (
                    <span style={{ position: "absolute", top: "-2px", left: "2px", color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                  )}
                </span>
                <span>Boîtier/Coque sans dommages</span>
              </div>
              <div className="checklist-item">
                <span className="checkbox" style={data.checklist_items?.includes("Câbles et chargeur présents") ? { background: "#2563eb", position: "relative" } : {}}>
                  {data.checklist_items?.includes("Câbles et chargeur présents") && (
                    <span style={{ position: "absolute", top: "-2px", left: "2px", color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                  )}
                </span>
                <span>Câbles et chargeur présents</span>
              </div>
              <div className="checklist-item">
                <span className="checkbox" style={data.checklist_items?.includes("Accessoires complets") ? { background: "#2563eb", position: "relative" } : {}}>
                  {data.checklist_items?.includes("Accessoires complets") && (
                    <span style={{ position: "absolute", top: "-2px", left: "2px", color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                  )}
                </span>
                <span>Accessoires complets</span>
              </div>
              <div className="checklist-item">
                <span className="checkbox" style={data.checklist_items?.includes("Données effacées/formaté") ? { background: "#2563eb", position: "relative" } : {}}>
                  {data.checklist_items?.includes("Données effacées/formaté") && (
                    <span style={{ position: "absolute", top: "-2px", left: "2px", color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                  )}
                </span>
                <span>Données effacées/formaté</span>
              </div>
              <div className="checklist-item">
                <span className="checkbox" style={data.checklist_items?.includes("Aucun logiciel personnel installé") ? { background: "#2563eb", position: "relative" } : {}}>
                  {data.checklist_items?.includes("Aucun logiciel personnel installé") && (
                    <span style={{ position: "absolute", top: "-2px", left: "2px", color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                  )}
                </span>
                <span>Aucun logiciel personnel installé</span>
              </div>
            </div>
            <div className="info-grid" style={{ marginTop: "10px", background: "#fff", border: "1px solid #e5e7eb" }}>
              <div className="info-item full-width">
                <div className="info-label">État général constaté</div>
                <div className="info-value">{data.etat_restitution || "À compléter par le service IT"}</div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-icon" aria-hidden="true" />
              <span>OBSERVATIONS ET REMARQUES</span>
            </div>
            <div className="notes-box">
              {data.commentaire || "Aucune observation particulière"}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-icon" aria-hidden="true" />
              <span>DÉCISION DU SERVICE IT</span>
            </div>
            {data.decision_it ? (
              <div className="checklist" style={{ gridTemplateColumns: "1fr" }}>
                <div className="checklist-item">
                  <span className="checkbox" style={{ background: "#2563eb", position: "relative" }}>
                    <span style={{ position: "absolute", top: "-2px", left: "2px", color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                  </span>
                  <span>
                    {data.decision_it === "bon_etat" && "Matériel accepté - Bon état (prêt pour réattribution)"}
                    {data.decision_it === "avec_reserves" && "Accepté avec réserves (voir remarques ci-dessus)"}
                    {data.decision_it === "reparation" && "Nécessite réparation avant réattribution"}
                    {data.decision_it === "reformer" && "Matériel à réformer (hors service)"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="checklist" style={{ gridTemplateColumns: "1fr" }}>
                <div className="checklist-item">
                  <span className="checkbox"></span>
                  <span>Matériel accepté - Bon état (prêt pour réattribution)</span>
                </div>
                <div className="checklist-item">
                  <span className="checkbox"></span>
                  <span>Accepté avec réserves (voir remarques ci-dessus)</span>
                </div>
                <div className="checklist-item">
                  <span className="checkbox"></span>
                  <span>Nécessite réparation avant réattribution</span>
                </div>
                <div className="checklist-item">
                  <span className="checkbox"></span>
                  <span>Matériel à réformer (hors service)</span>
                </div>
              </div>
            )}
          </div>

          <div className="signatures-container">
            <div className="signature-block">
              <div className="signature-title">SERVICE IT</div>
              <div className="signature-area">Signature et cachet</div>
              <div className="signature-date">Date : .... / .... / 20....</div>
            </div>
            <div className="signature-block">
              <div className="signature-title">LE RESTITUANT</div>
              <div className="signature-area">Signature (décharge de responsabilité)</div>
              <div className="signature-date">Date : .... / .... / 20....</div>
            </div>
          </div>

          <div className="footer">
            <p>Ce document atteste de la restitution officielle du matériel et de son état constaté.</p>
            <p>Le restituant est déchargé de toute responsabilité après signature du réceptionnaire.</p>
            <p>GÉNÉRÉ LE {new Date().toLocaleDateString("fr-FR").toUpperCase()} À {new Date().toLocaleTimeString("fr-FR")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
