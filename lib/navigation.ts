import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BarChart3,
  ClipboardList,
  FileKey,
  History,
  Home,
  Laptop,
  MessageSquarePlus,
  Package,
  ScrollText,
  Settings,
  ShoppingCart,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";
import type { RoleCode } from "@/lib/auth/role-types";
import { isStaffRole } from "@/lib/auth/role-types";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  admin?: boolean;
  /** Visible uniquement pour le staff ITAM/ITSM */
  staffOnly?: boolean;
  /** Visible pour tous (y compris collaborateurs) */
  everyone?: boolean;
  matchPrefix?: boolean;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const APP_NAME = "INFINITY IT";
export const APP_TAGLINE = "Support IT & gestion de parc";

export const navSections: NavSection[] = [
  {
    id: "portail",
    label: "Mon espace",
    items: [
      {
        href: "/mes-demandes",
        label: "Mes demandes",
        icon: MessageSquarePlus,
        everyone: true,
      },
    ],
  },
  {
    id: "support",
    label: "Support IT",
    items: [
      { href: "/dashboard", label: "Accueil", icon: Home, staffOnly: true },
      { href: "/itsm", label: "Tickets", icon: Ticket, matchPrefix: true, staffOnly: true },
      {
        href: "/employes",
        label: "Collaborateurs",
        icon: Users,
        matchPrefix: true,
        staffOnly: true,
      },
    ],
  },
  {
    id: "parc",
    label: "Parc informatique",
    items: [
      { href: "/materiels", label: "Matériel", icon: Laptop, matchPrefix: true, staffOnly: true },
      { href: "/destinataires", label: "Destinataires", icon: Users, staffOnly: true },
      { href: "/attributions", label: "Attributions", icon: ClipboardList, staffOnly: true },
      { href: "/achats", label: "Achats", icon: ShoppingCart, staffOnly: true },
      { href: "/alertes", label: "Alertes", icon: AlertCircle, staffOnly: true },
      { href: "/licences", label: "Licences", icon: FileKey, staffOnly: true },
      { href: "/reparations", label: "Réparations", icon: Wrench, staffOnly: true },
      { href: "/historique", label: "Historique", icon: History, staffOnly: true },
    ],
  },
  {
    id: "analyse",
    label: "Analyse",
    items: [
      { href: "/parc", label: "Analytics parc", icon: BarChart3, staffOnly: true },
      { href: "/rapports", label: "Rapports", icon: Package, staffOnly: true },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      { href: "/audit", label: "Journal d'audit", icon: ScrollText, admin: true },
      { href: "/administration", label: "Paramètres", icon: Settings, admin: true },
    ],
  },
];

export function isNavItemActive(pathname: string | null, item: NavItem) {
  if (!pathname) return false;
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
}

export function filterNavSections(input: {
  canAdmin: boolean;
  roles: RoleCode[];
  isStaff: boolean;
}) {
  const staff = input.isStaff || isStaffRole(input.roles) || input.canAdmin;

  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.admin) return input.canAdmin;
        if (item.everyone) return true;
        if (item.staffOnly) return staff;
        return staff;
      }),
    }))
    .filter((section) => section.items.length > 0);
}
