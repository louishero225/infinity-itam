import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  KeyRound,
  Laptop,
  Mail,
  MonitorSmartphone,
  Network,
  Printer,
  ShieldAlert,
  UserPlus,
  Wifi,
} from "lucide-react";

export type ServiceCatalogItem = {
  id: string;
  title: string;
  summary: string;
  categorie: string;
  priorite: "Normal" | "Medium" | "High";
  descriptionTemplate: string;
  icon: LucideIcon;
  group: "Accès" | "Matériel" | "Réseau" | "Logiciels" | "Autres";
};

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    id: "reset-mdp",
    title: "Réinitialisation mot de passe",
    summary: "Compte Microsoft, AD ou application métier",
    categorie: "Identités et Accès",
    priorite: "High",
    descriptionTemplate:
      "Demande de reset mot de passe.\nCompte concerné :\nDernière connexion réussie :\nSymptôme exact :",
    icon: KeyRound,
    group: "Accès",
  },
  {
    id: "acces-app",
    title: "Demande d'accès application",
    summary: "Droit, licence ou groupe de sécurité",
    categorie: "Identités et Accès",
    priorite: "Medium",
    descriptionTemplate:
      "Demande d'accès.\nApplication :\nNiveau d'accès souhaité :\nMotif / validation manager :",
    icon: ShieldAlert,
    group: "Accès",
  },
  {
    id: "nouveau-compte",
    title: "Création de compte",
    summary: "Nouvel arrivant ou prestataire",
    categorie: "Identités et Accès",
    priorite: "Medium",
    descriptionTemplate:
      "Création de compte.\nNom / prénom :\nDate d'arrivée :\nDépartement / manager :\nApplications requises :",
    icon: UserPlus,
    group: "Accès",
  },
  {
    id: "poste-hs",
    title: "Poste de travail en panne",
    summary: "Ne démarre plus, écran noir, lenteurs",
    categorie: "Poste de travail",
    priorite: "High",
    descriptionTemplate:
      "Incident poste de travail.\nModèle / code matériel :\nSymptômes :\nDepuis quand :\nImpact (bloquant ?) :",
    icon: Laptop,
    group: "Matériel",
  },
  {
    id: "peripherique",
    title: "Périphérique (souris, écran…)",
    summary: "Demande ou remplacement de matériel",
    categorie: "Hardware",
    priorite: "Normal",
    descriptionTemplate:
      "Demande matériel.\nType de périphérique :\nMotif (neuf / remplacement) :\nLocalisation :",
    icon: MonitorSmartphone,
    group: "Matériel",
  },
  {
    id: "imprimante",
    title: "Impression / scanner",
    summary: "File d'attente, cartouche, pilote",
    categorie: "Poste de travail",
    priorite: "Normal",
    descriptionTemplate:
      "Problème impression.\nImprimante / emplacement :\nMessage d'erreur :\nPoste concerné :",
    icon: Printer,
    group: "Matériel",
  },
  {
    id: "wifi",
    title: "Wi‑Fi / connexion réseau",
    summary: "Pas d'accès Internet ou intranet",
    categorie: "Réseau",
    priorite: "High",
    descriptionTemplate:
      "Incident réseau.\nSite / étage :\nWi‑Fi ou filaire :\nAutres utilisateurs impactés ? :\nMessage d'erreur :",
    icon: Wifi,
    group: "Réseau",
  },
  {
    id: "vpn-reseau",
    title: "VPN / accès distant",
    summary: "Connexion hors site impossible",
    categorie: "Réseau",
    priorite: "Medium",
    descriptionTemplate:
      "Problème VPN / accès distant.\nClient VPN utilisé :\nMessage d'erreur :\nDernière connexion OK :",
    icon: Network,
    group: "Réseau",
  },
  {
    id: "logiciel",
    title: "Installation / mise à jour logiciel",
    summary: "Besoin d'un outil ou d'une version",
    categorie: "Logiciels",
    priorite: "Normal",
    descriptionTemplate:
      "Demande logiciel.\nNom / version :\nLicence déjà disponible ? :\nUrgence métier :",
    icon: AppWindow,
    group: "Logiciels",
  },
  {
    id: "messagerie",
    title: "Messagerie / Outlook",
    summary: "Mail, calendrier, Teams",
    categorie: "Logiciels",
    priorite: "Medium",
    descriptionTemplate:
      "Incident messagerie.\nClient (Outlook / Web / mobile) :\nSymptôme :\nPièce jointe / destinataire concerné :",
    icon: Mail,
    group: "Logiciels",
  },
];

export function getCatalogItem(id: string | null | undefined) {
  if (!id) return null;
  return SERVICE_CATALOG.find((i) => i.id === id) ?? null;
}

export const CATALOG_GROUPS = ["Accès", "Matériel", "Réseau", "Logiciels", "Autres"] as const;
