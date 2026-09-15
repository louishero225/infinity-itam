import * as React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AccessProvider } from "@/components/app/access-provider";
import { AppBrand } from "@/components/app/app-brand";
import { GlobalSearch } from "@/components/app/global-search";
import { LogoutButton } from "@/components/app/logout-button";
import { MobileNav } from "@/components/app/mobile-nav";
import { SidebarNav } from "@/components/app/sidebar";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { RestitutionFicheHost } from "@/components/app/attributions/restitution-fiche-host";
import { APP_NAME } from "@/lib/navigation";
import { getAccess } from "@/lib/auth/roles";
import { isAdminRoute, isStaffRoute } from "@/lib/auth/staff-routes";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  // Un seul getAccess() (mis en cache React) pour toute la requête.
  let access;
  try {
    access = await getAccess();
  } catch {
    redirect("/login");
  }

  if (isAdminRoute(pathname) && !access.canAdmin) {
    redirect("/dashboard");
  }

  if (
    isStaffRoute(pathname) &&
    (access.isCollaborateurOnly || (!access.isStaff && !access.canAdmin))
  ) {
    redirect("/mes-demandes");
  }

  const value = {
    canWrite: access.canWrite,
    canAdmin: access.canAdmin,
    canRequestTicket: access.canRequestTicket,
    isStaff: access.isStaff,
    isCollaborateurOnly: access.isCollaborateurOnly,
    roles: [...access.roles],
  };

  return (
    <AccessProvider value={value}>
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-screen-2xl">
          <aside className="hidden w-64 shrink-0 border-r bg-sidebar p-4 md:block">
            <div className="mb-6">
              <AppBrand />
            </div>
            <SidebarNav />
            <div className="mt-4 border-t pt-4">
              <LogoutButton />
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
              <div className="flex h-14 items-center gap-3 px-4">
                <MobileNav />
                <div className="hidden text-sm font-semibold md:block">{APP_NAME}</div>
                <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 md:ml-6">
                  {access.isStaff ? <GlobalSearch /> : null}
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <main className="p-4 md:p-6">{children}</main>
            <RestitutionFicheHost />
          </div>
        </div>
      </div>
    </AccessProvider>
  );
}
