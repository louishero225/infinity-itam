"use client";

import { Building2, MapPin, User, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  BENEFICIAIRE_TYPE_LABELS,
  resolveBeneficiaire,
  type BeneficiaireInfo,
  type BeneficiaireType,
  type EmployeMini,
  type EntiteMini,
} from "@/lib/utils/beneficiaire";

type Props = {
  beneficiaire_type?: string | null;
  beneficiaire_label?: string | null;
  employe?: EmployeMini | null;
  entite?: EntiteMini | null;
  className?: string;
};

function iconForType(type: BeneficiaireInfo["type"]) {
  switch (type) {
    case "employe":
      return User;
    case "site":
      return MapPin;
    case "societe":
    case "departement":
      return Building2;
    default:
      return Users;
  }
}

function badgeClass(type: BeneficiaireInfo["type"]) {
  switch (type) {
    case "employe":
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100";
    case "departement":
      return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100";
    case "societe":
      return "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100";
    case "site":
      return "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function BeneficiaireBadge({
  beneficiaire_type,
  beneficiaire_label,
  employe,
  entite,
  className,
}: Props) {
  const info = resolveBeneficiaire({
    beneficiaire_type,
    beneficiaire_label,
    employe,
    entite,
  });
  const Icon = iconForType(info.type);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={badgeClass(info.type)}>
          <Icon className="size-3 mr-1" />
          {BENEFICIAIRE_TYPE_LABELS[info.type as BeneficiaireType] ?? "Destinataire"}
        </Badge>
        <div>
          <div className="font-medium text-sm">{info.label}</div>
          {info.sublabel && (
            <div className="text-xs text-muted-foreground">{info.sublabel}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function beneficiaireSortKey(props: Props) {
  return resolveBeneficiaire(props).label;
}

export function beneficiaireSearchText(props: Props) {
  const info = resolveBeneficiaire(props);
  return [info.label, info.sublabel, props.beneficiaire_label, props.employe?.departement]
    .filter(Boolean)
    .join(" ");
}
