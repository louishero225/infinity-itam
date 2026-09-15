import type { LucideIcon } from "lucide-react";
import {
  Mouse,
  Keyboard,
  Plug,
  Headphones,
  Usb,
  Cable,
  Briefcase,
  Camera,
  Unplug,
  Package,
} from "lucide-react";

/** Sous-catégories inventaire pour le type Accessoire */
export const ACCESSOIRE_SOUS_CATEGORIES = [
  "Souris",
  "Clavier",
  "Chargeur",
  "Casque",
  "Hub / Dock",
  "Câble",
  "Sacoche",
  "Webcam",
  "Adaptateur",
  "Autre",
] as const;

export type AccessoireSousCategorie = (typeof ACCESSOIRE_SOUS_CATEGORIES)[number];

export const ACCESSOIRE_SOUS_ICONS: Record<AccessoireSousCategorie, LucideIcon> = {
  Souris: Mouse,
  Clavier: Keyboard,
  Chargeur: Plug,
  Casque: Headphones,
  "Hub / Dock": Usb,
  Câble: Cable,
  Sacoche: Briefcase,
  Webcam: Camera,
  Adaptateur: Unplug,
  Autre: Package,
};

const SOUS_ALIASES: Record<string, AccessoireSousCategorie> = {
  souris: "Souris",
  mouse: "Souris",
  clavier: "Clavier",
  keyboard: "Clavier",
  chargeur: "Chargeur",
  "bloc chargeur": "Chargeur",
  alimentation: "Chargeur",
  casque: "Casque",
  headset: "Casque",
  ecouteurs: "Casque",
  hub: "Hub / Dock",
  dock: "Hub / Dock",
  "hub / dock": "Hub / Dock",
  docking: "Hub / Dock",
  cable: "Câble",
  cables: "Câble",
  "cable usb": "Câble",
  sacoche: "Sacoche",
  sac: "Sacoche",
  housse: "Sacoche",
  webcam: "Webcam",
  camera: "Webcam",
  adaptateur: "Adaptateur",
  dongle: "Adaptateur",
  convertisseur: "Adaptateur",
  autre: "Autre",
  peripherique: "Autre",
};

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeKey(value: string) {
  return stripAccents(value).toLowerCase().replace(/\s+/g, " ").trim();
}

export function normalizeAccessoireSousCategorie(
  value: string | null | undefined
): AccessoireSousCategorie | null {
  if (!value?.trim()) return null;
  const key = normalizeKey(value);
  if (SOUS_ALIASES[key]) return SOUS_ALIASES[key];
  const exact = ACCESSOIRE_SOUS_CATEGORIES.find((s) => normalizeKey(s) === key);
  return exact ?? null;
}

export function getAccessoireSousIcon(sous: string | null | undefined): LucideIcon {
  const canonical = normalizeAccessoireSousCategorie(sous);
  return canonical ? ACCESSOIRE_SOUS_ICONS[canonical] : Package;
}

export function AccessoireSousIcon({
  sous,
  className = "h-4 w-4",
}: {
  sous: string | null | undefined;
  className?: string;
}) {
  const Icon = getAccessoireSousIcon(sous);
  return <Icon className={className} aria-hidden />;
}
