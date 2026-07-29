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
  type LucideIcon,
} from "lucide-react";

import { normalizeMaterielType } from "@/lib/utils/materiel-taxonomy";

const ICON_BY_TYPE: Record<string, LucideIcon> = {
  "Ordinateur Portable": Laptop,
  "Ordinateur Fixe": Monitor,
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

export function MaterielIcon({ type, className = "h-4 w-4" }: { type: string; className?: string }) {
  switch (normalizeMaterielType(type)) {
    case "Ordinateur Portable":
      return <Laptop className={className} />;
    case "Ordinateur Fixe":
      return <Monitor className={className} />;
    case "Moniteur":
      return <Monitor className={className} />;
    case "Smartphone":
      return <Smartphone className={className} />;
    case "Tablet":
      return <Tablet className={className} />;
    case "Imprimante":
      return <Printer className={className} />;
    case "Réseau":
      return <Router className={className} />;
    case "Sécurité":
      return <Shield className={className} />;
    case "Batterie / Énergie":
      return <Battery className={className} />;
    case "Équipement AV / Studio":
      return <Video className={className} />;
    case "Serveur":
      return <Server className={className} />;
    case "Drone":
      return <Plane className={className} />;
    case "Stockage":
      return <HardDrive className={className} />;
    case "Poste VOIP":
      return <Phone className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
}

/** @deprecated Utiliser MaterielIcon */
export const MATERIEL_ICONS = ICON_BY_TYPE;
