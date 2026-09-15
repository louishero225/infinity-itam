"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Printer } from "lucide-react";
import { MaterielIcon } from "@/lib/utils/materiel-icons";

export type FicheReceptionData = {
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

type FicheData = FicheReceptionData;

const CHECKLIST_LABELS = [
  "Appareil complet et fonctionnel",
  "Écran intact sans rayures",
  "Clavier/Souris fonctionnels",
  "Boîtier/Coque sans dommages",
  "Câbles et chargeur présents",
  "Accessoires complets",
  "Données effacées/formaté",
  "Aucun logiciel personnel installé",
] as const;

export function FicheReceptionMateriel({
  data,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  autoPrint = false,
}: {
  data: FicheData;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  autoPrint?: boolean;
}) {
  const ficheRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const handlePrint = () => {
    if (!ficheRef.current) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Fiche de Réception - ${data.code_materiel}</title>
<style>
@page{size:A4;margin:15mm}*{box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.5;color:#1a1a1a;margin:0;padding:30px;background:#fff}
.page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:1px solid #e0e0e0}
.logo-box{width:120px;height:50px;display:flex;align-items:center;justify-content:center}
.logo-box img{max-width:100%;max-height:100%;object-fit:contain}
.title-box{text-align:right;flex:1;padding-left:20px}
.title-box h1{margin:0;font-size:26px;font-weight:700;color:#111;line-height:1.2}
.subtitle{color:#666;font-size:13px;margin-top:4px}
.meta-info{margin-top:10px;font-size:12px;color:#444}
.section{margin-bottom:22px}
.section-header{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;letter-spacing:.04em;margin-bottom:10px;color:#111;border-bottom:2px solid #2563eb;padding-bottom:6px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}
.info-label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.03em}
.info-value{font-size:14px;font-weight:600;color:#111}
.checklist-item{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:13px}
.checkbox{width:14px;height:14px;border:1.5px solid #333;display:inline-block;border-radius:2px;position:relative}
.signatures-container{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px}
.signature-title{font-weight:700;font-size:12px;margin-bottom:8px}
.signature-area{border-bottom:1px solid #333;height:60px;margin-bottom:8px}
.signature-date{font-size:12px;color:#555}
.footer{margin-top:30px;padding-top:12px;border-top:1px solid #ddd;font-size:11px;color:#666;text-align:center}
.notes-box{border:1px solid #e5e7eb;padding:12px;min-height:60px;font-size:13px}
</style></head><body>${ficheRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  useEffect(() => {
    if (!autoPrint || !open) return;
    // Laisser le Dialog peindre avant d'ouvrir la fenêtre d'impression
    const t = window.setTimeout(() => {
      handlePrint();
    }, 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="mr-1 h-4 w-4" />
            Fiche réception
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fiche de Réception de Matériel (Restitution)</DialogTitle>
        </DialogHeader>

        <div className="no-print mb-4 flex justify-end">
          <Button onClick={handlePrint} size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>

        <div ref={ficheRef} className="bg-white p-2">
          <div
            className="page-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <div className="logo-box">
              <Image
                src="/IAG 11 - Copie.jpg"
                alt="Logo entreprise"
                width={120}
                height={50}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="title-box" style={{ textAlign: "right", flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                FICHE DE RESTITUTION
                <br />
                DE MATÉRIEL
              </h1>
              <div className="subtitle" style={{ color: "#666", fontSize: 13 }}>
                Document officiel de restitution et contrôle
              </div>
              <div className="meta-info" style={{ marginTop: 8, fontSize: 12 }}>
                <div>
                  <strong>N° Attribution :</strong>{" "}
                  {data.numero_attribution || data.attribution_id}
                </div>
                <div>
                  <strong>Date restitution :</strong>{" "}
                  {data.date_restitution
                    ? new Date(data.date_restitution).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "À compléter"}
                </div>
              </div>
            </div>
          </div>

          <div className="section" style={{ marginBottom: 20 }}>
            <div
              className="section-header"
              style={{
                fontWeight: 700,
                fontSize: 13,
                borderBottom: "2px solid #2563eb",
                paddingBottom: 6,
                marginBottom: 10,
              }}
            >
              RESTITUÉ PAR
            </div>
            <div
              className="info-grid"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
            >
              <div>
                <div className="info-label" style={{ fontSize: 11, color: "#666" }}>
                  Nom & Prénom
                </div>
                <div className="info-value" style={{ fontWeight: 600 }}>
                  {data.beneficiaire_type === "employe"
                    ? `${data.beneficiaire_prenom || ""} ${data.beneficiaire_nom}`.trim()
                    : data.beneficiaire_nom}
                </div>
              </div>
              {data.beneficiaire_departement ? (
                <div>
                  <div className="info-label" style={{ fontSize: 11, color: "#666" }}>
                    Département
                  </div>
                  <div className="info-value" style={{ fontWeight: 600 }}>
                    {data.beneficiaire_departement}
                  </div>
                </div>
              ) : null}
              <div>
                <div className="info-label" style={{ fontSize: 11, color: "#666" }}>
                  Date attribution initiale
                </div>
                <div className="info-value" style={{ fontWeight: 600 }}>
                  {new Date(data.date_attribution).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="section" style={{ marginBottom: 20 }}>
            <div
              className="section-header"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                fontSize: 13,
                borderBottom: "2px solid #2563eb",
                paddingBottom: 6,
                marginBottom: 10,
              }}
            >
              <MaterielIcon type={data.type_materiel} className="h-5 w-5" />
              MATÉRIEL RESTITUÉ
            </div>
            <div
              className="info-grid"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
            >
              <div>
                <div className="info-label" style={{ fontSize: 11, color: "#666" }}>
                  Code Matériel
                </div>
                <div className="info-value" style={{ fontWeight: 600 }}>
                  {data.code_materiel}
                </div>
              </div>
              <div>
                <div className="info-label" style={{ fontSize: 11, color: "#666" }}>
                  Type / Marque
                </div>
                <div className="info-value" style={{ fontWeight: 600 }}>
                  {data.type_materiel}
                  {data.marque ? ` - ${data.marque}` : ""}
                </div>
              </div>
              {data.modele ? (
                <div>
                  <div className="info-label" style={{ fontSize: 11, color: "#666" }}>
                    Modèle
                  </div>
                  <div className="info-value" style={{ fontWeight: 600 }}>
                    {data.modele}
                  </div>
                </div>
              ) : null}
              {data.numero_serie ? (
                <div>
                  <div className="info-label" style={{ fontSize: 11, color: "#666" }}>
                    Numéro de série
                  </div>
                  <div className="info-value" style={{ fontWeight: 600 }}>
                    {data.numero_serie}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="section" style={{ marginBottom: 20 }}>
            <div
              className="section-header"
              style={{
                fontWeight: 700,
                fontSize: 13,
                borderBottom: "2px solid #2563eb",
                paddingBottom: 6,
                marginBottom: 10,
              }}
            >
              CONTRÔLE DE L&apos;ÉTAT DU MATÉRIEL
            </div>
            <div className="checklist">
              {CHECKLIST_LABELS.map((label) => {
                const checked = data.checklist_items?.includes(label);
                return (
                  <div
                    key={label}
                    className="checklist-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      margin: "6px 0",
                      fontSize: 13,
                    }}
                  >
                    <span
                      className="checkbox"
                      style={
                        checked
                          ? {
                              background: "#2563eb",
                              position: "relative",
                              width: 14,
                              height: 14,
                              border: "1.5px solid #333",
                              display: "inline-block",
                            }
                          : {
                              width: 14,
                              height: 14,
                              border: "1.5px solid #333",
                              display: "inline-block",
                            }
                      }
                    >
                      {checked ? (
                        <span
                          style={{
                            position: "absolute",
                            top: -2,
                            left: 2,
                            color: "white",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          ✓
                        </span>
                      ) : null}
                    </span>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, border: "1px solid #e5e7eb", padding: 10 }}>
              <div className="info-label" style={{ fontSize: 11, color: "#666" }}>
                État général constaté
              </div>
              <div className="info-value" style={{ fontWeight: 600 }}>
                {data.etat_restitution || "À compléter par le service IT"}
              </div>
            </div>
          </div>

          <div className="section" style={{ marginBottom: 20 }}>
            <div
              className="section-header"
              style={{
                fontWeight: 700,
                fontSize: 13,
                borderBottom: "2px solid #2563eb",
                paddingBottom: 6,
                marginBottom: 10,
              }}
            >
              OBSERVATIONS ET REMARQUES
            </div>
            <div
              className="notes-box"
              style={{ border: "1px solid #e5e7eb", padding: 12, minHeight: 60, fontSize: 13 }}
            >
              {data.commentaire || "Aucune observation particulière"}
            </div>
          </div>

          <div className="section" style={{ marginBottom: 20 }}>
            <div
              className="section-header"
              style={{
                fontWeight: 700,
                fontSize: 13,
                borderBottom: "2px solid #2563eb",
                paddingBottom: 6,
                marginBottom: 10,
              }}
            >
              DÉCISION DU SERVICE IT
            </div>
            {data.decision_it ? (
              <div
                className="checklist-item"
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
              >
                <span
                  className="checkbox"
                  style={{
                    background: "#2563eb",
                    position: "relative",
                    width: 14,
                    height: 14,
                    border: "1.5px solid #333",
                    display: "inline-block",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      left: 2,
                      color: "white",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </span>
                </span>
                <span>
                  {data.decision_it === "bon_etat" &&
                    "Matériel accepté - Bon état (prêt pour réattribution)"}
                  {data.decision_it === "avec_reserves" &&
                    "Accepté avec réserves (voir remarques ci-dessus)"}
                  {data.decision_it === "reparation" &&
                    "Nécessite réparation avant réattribution"}
                  {data.decision_it === "reformer" && "Matériel à réformer (hors service)"}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#666" }}>Décision non renseignée</div>
            )}
          </div>

          <div
            className="signatures-container"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 40 }}
          >
            <div>
              <div className="signature-title" style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                SERVICE IT
              </div>
              <div
                className="signature-area"
                style={{ borderBottom: "1px solid #333", height: 60, marginBottom: 8 }}
              >
                Signature et cachet
              </div>
              <div className="signature-date" style={{ fontSize: 12, color: "#555" }}>
                Date : .... / .... / 20....
              </div>
            </div>
            <div>
              <div className="signature-title" style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                LE RESTITUANT
              </div>
              <div
                className="signature-area"
                style={{ borderBottom: "1px solid #333", height: 60, marginBottom: 8 }}
              >
                Signature (décharge de responsabilité)
              </div>
              <div className="signature-date" style={{ fontSize: 12, color: "#555" }}>
                Date : .... / .... / 20....
              </div>
            </div>
          </div>

          <div
            className="footer"
            style={{
              marginTop: 30,
              paddingTop: 12,
              borderTop: "1px solid #ddd",
              fontSize: 11,
              color: "#666",
              textAlign: "center",
            }}
          >
            <p>Ce document atteste de la restitution officielle du matériel et de son état constaté.</p>
            <p>
              Le restituant est déchargé de toute responsabilité après signature du réceptionnaire.
            </p>
            <p>
              GÉNÉRÉ LE {new Date().toLocaleDateString("fr-FR").toUpperCase()} À{" "}
              {new Date().toLocaleTimeString("fr-FR")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
