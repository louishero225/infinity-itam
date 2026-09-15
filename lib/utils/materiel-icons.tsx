import {
  Laptop,
  Monitor,
  Printer,
  Smartphone,
  Router,
  Network,
  Server,
  Zap,
  MousePointer,
  HelpCircle,
  Tablet,
  Shield,
  Battery,
  Video,
  HardDrive,
  Phone,
  Plane,
  Cable,
  PcCase,
  type LucideIcon,
} from "lucide-react";

import { normalizeMaterielType } from "@/lib/utils/materiel-taxonomy";

/** Icône Lucide par type matériel canonique */
export const ICON_BY_TYPE: Record<string, LucideIcon> = {
  "Ordinateur Portable": Laptop,
  "Ordinateur Fixe": PcCase,
  Moniteur: Monitor,
  Smartphone: Smartphone,
  Téléphone: Smartphone,
  Tablet: Tablet,
  Imprimante: Printer,
  Réseau: Router,
  Sécurité: Shield,
  "Batterie / Énergie": Battery,
  "Équipement AV / Studio": Video,
  Serveur: Server,
  Drone: Plane,
  Stockage: HardDrive,
  "Poste VOIP": Phone,
  Accessoire: Cable,
  Routeur: Router,
  Switch: Network,
  Onduleur: Zap,
  Périphérique: MousePointer,
  Autre: HelpCircle,
};

export function getMaterielIcon(type: string): LucideIcon {
  const canonical = normalizeMaterielType(type);
  return ICON_BY_TYPE[canonical] ?? ICON_BY_TYPE[type] ?? HelpCircle;
}

export function MaterielIcon({
  type,
  className = "h-4 w-4",
}: {
  type: string;
  className?: string;
}) {
  const Icon = getMaterielIcon(type);
  return <Icon className={className} aria-hidden />;
}

/** @deprecated Utiliser ICON_BY_TYPE / getMaterielIcon */
export const MATERIEL_ICONS = ICON_BY_TYPE;
