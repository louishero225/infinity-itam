"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  ClipboardList,
  FileKey,
  History,
  Laptop,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AlertesBadge } from "./alertes-badge";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: BarChart3 },
  { href: "/materiels", label: "Matériel", icon: Laptop },
  { href: "/destinataires", label: "Destinataires", icon: Users },
  { href: "/attributions", label: "Attributions", icon: ClipboardList },
  { href: "/achats", label: "Achats", icon: ShoppingCart },
  { href: "/alertes", label: "Alertes", icon: AlertCircle },
  { href: "/licences", label: "Licences", icon: FileKey },
  { href: "/reparations", label: "Réparations", icon: Wrench },
  { href: "/historique", label: "Historique", icon: History },
  { href: "/rapports", label: "Rapports", icon: Package },
  { href: "/administration", label: "Administration", icon: Settings },
];

export function SidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navItems.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-200",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            <span>{item.label}</span>
            {item.href === "/alertes" && <AlertesBadge />}
          </Link>
        );
      })}
    </nav>
  );
}
