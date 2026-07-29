"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { getMaterielIcon } from "@/lib/utils/materiel-icons";

type MaterielItem = {
  code_materiel: string;
  type_materiel: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  numero_attribution: string;
};

type FicheGroupeeData = {
  numeros_attribution: string[];
  date_attribution: string;
  beneficiaire_nom: string;
  beneficiaire_prenom?: string;
  beneficiaire_departement?: string;
  materiels: MaterielItem[];
  commentaire?: string;
};

export function FicheRemiseGroupee({ data }: { data: FicheGroupeeData }) {
  const ficheRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (ficheRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Fiche de Remise - Kit Onboarding</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                  padding: 15mm;
                  background: white;
                }
                .fiche-container {
                  max-width: 190mm;
                  margin: 0 auto;
                  background: white;
                }
                .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 20px;
                  padding-bottom: 15px;
                  border-bottom: 3px solid #2563eb;
                }
                .logo-section {
                  width: 120px;
                  height: 50px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .logo-section img {
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                }
                .numero-section {
                  text-align: right;
                }
                .numero-label {
                  font-size: 10px;
                  color: #6b7280;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 4px;
                }
                .numero-value {
                  font-size: 13px;
                  font-weight: 700;
                  color: #2563eb;
                  font-family: 'Courier New', monospace;
                }
                .document-title {
                  text-align: center;
                  font-size: 18px;
                  font-weight: 700;
                  color: #1f2937;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                .document-subtitle {
                  text-align: center;
                  font-size: 12px;
                  color: #6b7280;
                  margin-bottom: 20px;
                }
                .section {
                  margin-bottom: 18px;
                  border: 1px solid #e5e7eb;
                  border-radius: 6px;
                  overflow: hidden;
                }
                .section-header {
                  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                  color: white;
                  padding: 8px 12px;
                  font-size: 12px;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                .section-icon {
                  font-size: 14px;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 10px;
                  padding: 12px;
                  background: #f9fafb;
                }
                .info-item {
                  display: flex;
                  flex-direction: column;
                }
                .info-item.full-width {
                  grid-column: 1 / -1;
                }
                .info-label {
                  font-size: 9px;
                  color: #6b7280;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 3px;
                  font-weight: 600;
                }
                .info-value {
                  font-size: 12px;
                  color: #1f2937;
                  font-weight: 500;
                }
                .materiel-list {
                  padding: 12px;
                  background: white;
                }
                .materiel-item {
                  border: 1px solid #e5e7eb;
                  border-radius: 4px;
                  padding: 10px;
                  margin-bottom: 10px;
                  background: #f9fafb;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                }
                .materiel-item:last-child {
                  margin-bottom: 0;
                }
                .materiel-checkbox {
                  width: 14px;
                  height: 14px;
                  border: 2px solid #2563eb;
                  border-radius: 3px;
                  flex-shrink: 0;
                  background: white;
                }
                .materiel-details {
                  flex: 1;
                }
                .materiel-name {
                  font-size: 12px;
                  font-weight: 600;
                  color: #1f2937;
                  margin-bottom: 3px;
                }
                .materiel-specs {
                  font-size: 10px;
                  color: #6b7280;
                }
                .materiel-numero {
                  font-size: 10px;
                  font-weight: 600;
                  color: #2563eb;
                  font-family: 'Courier New', monospace;
                  background: white;
                  padding: 3px 8px;
                  border-radius: 3px;
                  border: 1px solid #dbeafe;
                }
                .conditions {
                  padding: 12px;
                  background: #fef3c7;
                  border-left: 3px solid #f59e0b;
                }
                .conditions-title {
                  font-size: 11px;
                  font-weight: 600;
                  color: #92400e;
                  margin-bottom: 8px;
                }
                .conditions-list {
                  font-size: 10px;
                  color: #78350f;
                  line-height: 1.6;
                  padding-left: 15px;
                }
                .conditions-list li {
                  margin-bottom: 4px;
                }
                .signatures-container {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin-top: 25px;
                }
                .signature-block {
                  text-align: center;
                }
                .signature-title {
                  font-size: 10px;
                  font-weight: 600;
                  color: #374151;
                  text-transform: uppercase;
                  margin-bottom: 8px;
                  letter-spacing: 0.5px;
                }
                .signature-area {
                  height: 60px;
                  border: 1px dashed #9ca3af;
                  border-radius: 4px;
                  background: #f9fafb;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 9px;
                  color: #9ca3af;
                  margin-bottom: 6px;
                }
                .signature-date {
                  font-size: 10px;
                  color: #6b7280;
                }
                .footer {
                  margin-top: 30px;
                  padding-top: 12px;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  font-size: 9px;
                  color: #9ca3af;
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
    <div>
      <div className="flex justify-end mb-4 no-print">
        <Button onClick={handlePrint} size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Imprimer la fiche
        </Button>
      </div>

      <div ref={ficheRef} className="fiche-container">
        <div className="header">
          <div className="logo-section">
            <h1>VOTRE ENTREPRISE</h1>
            <p>Service Informatique</p>
          </div>
          <div className="numero-section">
            <div className="numero-label">Numéros d'attribution</div>
            <div className="numero-value">{data.numeros_attribution.join(", ")}</div>
          </div>
        </div>

        <div className="document-title">Fiche de Remise de Matériel</div>
        <div className="document-subtitle">Kit d'Onboarding - Attribution Multiple</div>

        <div className="section">
          <div className="section-header">
            <span className="section-icon">👤</span>
            <span>BÉNÉFICIAIRE</span>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Nom et Prénom</div>
              <div className="info-value">
                {data.beneficiaire_prenom} {data.beneficiaire_nom}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Département</div>
              <div className="info-value">{data.beneficiaire_departement || "—"}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Date d'attribution</div>
              <div className="info-value">{new Date(data.date_attribution).toLocaleDateString("fr-FR")}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Nombre de matériels</div>
              <div className="info-value">{data.materiels.length} équipement(s)</div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <span className="section-icon">📦</span>
            <span>MATÉRIELS REMIS</span>
          </div>
          <div className="materiel-list">
            {data.materiels.map((materiel, index) => (
              <div key={index} className="materiel-item">
                <span className="materiel-checkbox"></span>
                <div className="materiel-details">
                  <div className="materiel-name">
                    {materiel.type_materiel} {materiel.marque ? `- ${materiel.marque}` : ""} {materiel.modele || ""}
                  </div>
                  <div className="materiel-specs">
                    Code: {materiel.code_materiel}
                    {materiel.numero_serie && ` • S/N: ${materiel.numero_serie}`}
                  </div>
                </div>
                <div className="materiel-numero">{materiel.numero_attribution}</div>
              </div>
            ))}
          </div>
        </div>

        {data.commentaire && (
          <div className="section">
            <div className="section-header">
              <span className="section-icon">📝</span>
              <span>OBSERVATIONS</span>
            </div>
            <div className="info-grid">
              <div className="info-item full-width">
                <div className="info-value">{data.commentaire}</div>
              </div>
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-header">
            <span className="section-icon">⚠️</span>
            <span>CONDITIONS D'UTILISATION</span>
          </div>
          <div className="conditions">
            <div className="conditions-title">Le bénéficiaire s'engage à :</div>
            <ul className="conditions-list">
              <li>Utiliser le matériel conformément aux règles de sécurité informatique de l'entreprise</li>
              <li>Préserver le matériel et en assurer un usage professionnel responsable</li>
              <li>Signaler immédiatement toute panne, dysfonctionnement ou perte au service IT</li>
              <li>Restituer le matériel en bon état en cas de départ ou de changement de fonction</li>
              <li>Ne pas installer de logiciels non autorisés sans accord préalable du service IT</li>
            </ul>
          </div>
        </div>

        <div className="signatures-container">
          <div className="signature-block">
            <div className="signature-title">Le Responsable IT</div>
            <div className="signature-area">Signature et cachet</div>
            <div className="signature-date">Date : .... / .... / 20....</div>
          </div>
          <div className="signature-block">
            <div className="signature-title">Le Bénéficiaire</div>
            <div className="signature-area">Signature (pour réception et accord)</div>
            <div className="signature-date">Date : .... / .... / 20....</div>
          </div>
        </div>

        <div className="footer">
          Ce document constitue un justificatif de remise de matériel informatique.
          Il doit être conservé par le service IT et le bénéficiaire pour toute référence ultérieure.
        </div>
      </div>
    </div>
  );
}
