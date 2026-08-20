"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { filterNavSections, isNavItemActive } from "@/lib/navigation";
import { useAccess } from "@/components/app/access-provider";
import { AlertesBadge } from "./alertes-badge";

export function SidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { canAdmin, roles, isStaff } = useAccess();

  const sections = filterNavSections({ canAdmin, roles, isStaff });

  return (
    <nav className={cn("flex flex-col gap-5", className)}>
      {sections.map((section) => (
        <div key={section.id}>
          <p className="text-muted-foreground mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest">
            {section.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isNavItemActive(pathname, item);
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
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.href === "/alertes" && isStaff ? <AlertesBadge /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
