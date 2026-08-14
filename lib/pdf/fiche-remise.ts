import { jsPDF } from "jspdf";

type FichePdfInput = {
  numero_attribution?: string | null;
  date_attribution: string;
  code_materiel: string;
  type_materiel: string;
  marque?: string | null;
  modele?: string | null;
  numero_serie?: string | null;
  beneficiaire_nom: string;
  beneficiaire_prenom?: string | null;
  beneficiaire_departement?: string | null;
};

function line(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.text(label, 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(value || "—", 70, y);
}

export function buildFicheRemisePdf(data: FichePdfInput) {
  const doc = new jsPDF();
  const beneficiaire = `${data.beneficiaire_prenom ?? ""} ${data.beneficiaire_nom}`.trim();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INFINITY AFRICA GROUP", 20, 20);
  doc.setFontSize(13);
  doc.text("Fiche de remise de materiel", 20, 30);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  line(doc, "N attribution", data.numero_attribution ?? "—", 45);
  line(doc, "Date", data.date_attribution, 53);
  line(doc, "Code", data.code_materiel, 61);
  line(doc, "Type", data.type_materiel, 69);
  line(doc, "Marque", `${data.marque ?? "—"} ${data.modele ?? ""}`.trim(), 77);
  line(doc, "N serie", data.numero_serie ?? "—", 85);
  line(doc, "Beneficiaire", beneficiaire, 93);
  line(doc, "Departement", data.beneficiaire_departement ?? "—", 101);

  doc.setFont("helvetica", "bold");
  doc.text("Conditions", 20, 118);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const conditions = [
    "Utiliser le materiel conformement aux regles de securite informatique.",
    "Signaler toute panne, perte ou vol au service IT.",
    "Restituer le materiel en cas de depart ou de changement de fonction.",
  ];
  conditions.forEach((c, i) => doc.text(`- ${c}`, 20, 128 + i * 8));

  doc.setFontSize(11);
  doc.text("Signature service IT", 20, 170);
  doc.rect(20, 175, 70, 30);
  doc.text("Signature beneficiaire", 120, 170);
  doc.rect(120, 175, 70, 30);

  return doc.output("arraybuffer");
}
