export const ITSM_STATUTS = ["Ouvert", "En cours", "Résolu", "Fermé"] as const;

export const ITSM_PRIORITES = ["Non défini", "Normal", "Medium", "High"] as const;

export const ITSM_ENTITES = [
  "IAC",
  "IAF",
  "IAP",
  "IAV",
  "IAT",
  "IAG",
  "Siège / Accueil",
] as const;

export const ITSM_CATEGORIES = [
  "Poste de travail",
  "Identités et Accès",
  "Réseau",
  "Infrastructure",
  "Hardware",
  "Téléphone",
  "Logiciels",
  "Matériel non informatique",
  "Général",
  "Non catégorisé",
  "Autre",
] as const;

export const ITSM_CANAUX = ["Téléphone", "Verbal", "Email", "ManageEngine", "Portail"] as const;

export const DEFAULT_TECHNICIAN = "Guillaume BADOU";

/** Agents assignables (console). */
export const ITSM_TECHNICIENS = [
  DEFAULT_TECHNICIAN,
  "Non assigné",
] as const;

/** Macros / réponses rapides type Zendesk. */
export const ITSM_QUICK_REPLIES = [
  {
    id: "prise-en-charge",
    label: "Prise en charge",
    body: "Bonjour,\n\nVotre demande a bien été prise en charge. Nous revenons vers vous rapidement.\n\nCordialement,\nSupport IT",
  },
  {
    id: "info-manquante",
    label: "Infos manquantes",
    body: "Bonjour,\n\nPour avancer, merci de préciser :\n- Symptôme exact\n- Depuis quand\n- Capture d'écran si possible\n\nCordialement,\nSupport IT",
  },
  {
    id: "resolu",
    label: "Résolu",
    body: "Bonjour,\n\nVotre demande est traitée. N'hésitez pas à rouvrir un ticket si le problème persiste.\n\nCordialement,\nSupport IT",
  },
  {
    id: "en-attente",
    label: "En attente utilisateur",
    body: "Bonjour,\n\nNous attendons un retour de votre part pour poursuivre le traitement.\n\nCordialement,\nSupport IT",
  },
] as const;

export const MANAGEENGINE_CAT_MAP: Record<string, string> = {
  "Poste de travail": "Poste de travail",
  Impression: "Poste de travail",
  "Accès & Comptes": "Identités et Accès",
  "Identités et Accès": "Identités et Accès",
  "Matériel Informatique": "Hardware",
  Hardware: "Hardware",
  "Réseau & Wi-Fi": "Réseau",
  Réseau: "Réseau",
  Infrastructure: "Infrastructure",
};

export const ONBOARDING_STEPS = [
  {
    offsetDays: 0,
    heure: "08:30",
    categorie: "Hardware",
    description: "Livraison, masterisation et paramétrage du poste de travail",
  },
  {
    offsetDays: 0,
    heure: "09:30",
    categorie: "Identités et Accès",
    description: "Création des accès système initiaux (comptes, email)",
  },
  {
    offsetDays: 1,
    heure: "10:15",
    categorie: "Logiciels",
    description: "Installation des logiciels métiers de base",
  },
  {
    offsetDays: 2,
    heure: "14:00",
    categorie: "Réseau",
    description: "Positionnement physique et brassage réseau du poste",
  },
  {
    offsetDays: 3,
    heure: "09:45",
    categorie: "Identités et Accès",
    description: "Configuration du tableau de bord utilisateur et des profils d'accès",
  },
  {
    offsetDays: 6,
    heure: "15:10",
    categorie: "Logiciels",
    description: "Assistance et prise en main de la plateforme collaborative (Asana)",
  },
  {
    offsetDays: 7,
    heure: "15:45",
    categorie: "Matériel non informatique",
    description: "Installation et test de l'onduleur",
  },
] as const;
