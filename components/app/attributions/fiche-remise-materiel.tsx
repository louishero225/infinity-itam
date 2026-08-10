"use client";

import { useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Printer } from "lucide-react";

type FicheData = {
  attribution_id: string;
  numero_attribution?: string;
  date_attribution: string;
  code_materiel: string;
  type_materiel: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  etat_remise?: string;
  accessoires?: string;
  beneficiaire_nom: string;
  beneficiaire_prenom?: string;
  beneficiaire_departement?: string;
  beneficiaire_type: string;
};

export function FicheRemiseMateriel({ data }: { data: FicheData }) {
  const ficheRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (ficheRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Fiche de Remise de Matériel - ${data.code_materiel}</title>
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
                  margin-bottom: 25px;
                  page-break-inside: avoid;
                }
                .section-header {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  color: #2563eb;
                  font-weight: 700;
                  font-size: 14px;
                  text-transform: uppercase;
                  margin-bottom: 15px;
                  padding-bottom: 8px;
                  border-bottom: 2px solid #e5e7eb;
                }
                .section-icon {
                  width: 6px;
                  height: 6px;
                  border-radius: 1px;
                  background: currentColor;
                  flex-shrink: 0;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  background: #f9fafb;
                  padding: 20px;
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
                  font-size: 14px;
                  color: #1a1a1a;
                  font-weight: 600;
                }
                .info-value.highlight {
                  color: #059669;
                  background: #d1fae5;
                  padding: 4px 8px;
                  border-radius: 4px;
                  display: inline-block;
                  font-size: 12px;
                }
                .full-width {
                  grid-column: 1 / -1;
                }
                .conditions-list {
                  list-style: none;
                  padding: 0;
                  margin: 0;
                }
                .conditions-list li {
                  padding: 10px 0;
                  padding-left: 30px;
                  position: relative;
                  border-bottom: 1px solid #e5e7eb;
                  font-size: 13px;
                  color: #374151;
                }
                .conditions-list li:before {
                  content: '✓';
                  position: absolute;
                  left: 8px;
                  color: #2563eb;
                  font-weight: bold;
                }
                .conditions-list li:last-child {
                  border-bottom: none;
                }
                .signatures-container {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 30px;
                  margin-top: 40px;
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
                  height: 100px;
                  margin-bottom: 10px;
                  background: #fafafa;
                  display: flex;
                  align-items: flex-end;
                  justify-content: center;
                  color: #9ca3af;
                  font-size: 11px;
                  font-style: italic;
                  padding-bottom: 5px;
                }
                .signature-date {
                  font-size: 11px;
                  color: #6b7280;
                  padding-bottom: 5px;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 15px;
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1" />
          Fiche remise
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fiche de Remise de Matériel</DialogTitle>
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
              <h1>FICHE DE REMISE<br/>DE MATÉRIEL</h1>
              <div className="subtitle">Document officiel de transfert de responsabilité</div>
              <div className="meta-info">
                <div><strong>N° Attribution :</strong> {data.numero_attribution || data.attribution_id}</div>
                <div><strong>Date :</strong> {new Date(data.date_attribution).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}</div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-icon" aria-hidden="true" />
              <span>BÉNÉFICIAIRE</span>
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
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-icon" aria-hidden="true" />
              <span>DÉTAILS DU MATÉRIEL</span>
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
              <div className="info-item">
                <div className="info-label">État à la remise</div>
                <div className="info-value highlight">{data.etat_remise || "BON ÉTAT"}</div>
              </div>
              {data.accessoires && (
                <div className="info-item full-width">
                  <div className="info-label">Accessoires inclus</div>
                  <div className="info-value">{data.accessoires}</div>
                </div>
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="section-icon" aria-hidden="true" />
              <span>CONDITIONS D&apos;UTILISATION</span>
            </div>
            <ul className="conditions-list">
              <li>Le bénéficiaire s&apos;engage à utiliser le matériel dans le cadre professionnel uniquement.</li>
              <li>Le matériel reste la propriété de l&apos;entreprise et doit être restitué sur demande.</li>
              <li>Le bénéficiaire est responsable du matériel et doit signaler tout dysfonctionnement.</li>
              <li>Toute perte ou dégradation anormale devra être déclarée immédiatement.</li>
            </ul>
          </div>

          <div className="signatures-container">
            <div className="signature-block">
              <div className="signature-title">SERVICE IT</div>
              <div className="signature-area">Signature</div>
              <div className="signature-date">Date : .... / .... / 20....</div>
            </div>
            <div className="signature-block">
              <div className="signature-title">LE BÉNÉFICIAIRE</div>
              <div className="signature-area">Signature (précédée de &quot;Lu et approuvé&quot;)</div>
              <div className="signature-date">Date : .... / .... / 20....</div>
            </div>
          </div>

          <div className="footer">
            <p>Ce document atteste de la remise officielle du matériel et engage la responsabilité du bénéficiaire.</p>
            <p>GÉNÉRÉ LE {new Date().toLocaleDateString("fr-FR").toUpperCase()} À {new Date().toLocaleTimeString("fr-FR")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
