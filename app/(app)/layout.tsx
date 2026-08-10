import * as React from "react";

import { LogoutButton } from "@/components/app/logout-button";
import { MobileNav } from "@/components/app/mobile-nav";
import { SidebarNav } from "@/components/app/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-screen-2xl">
        <aside className="hidden w-64 shrink-0 border-r bg-sidebar p-4 md:block">
          <div className="mb-6 rounded-lg border border-sidebar-border bg-background/60 px-3 py-3">
            <div className="text-sm font-semibold tracking-tight">INFINITY ITAM</div>
            <p className="text-muted-foreground mt-0.5 text-xs">Gestion de parc</p>
          </div>
          <SidebarNav />
          <div className="mt-4 border-t pt-4">
            <LogoutButton />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <div className="flex h-14 items-center gap-3 px-4">
              <MobileNav title="INFINITY ITAM" />
              <div className="hidden text-sm font-semibold md:block">INFINITY ITAM</div>
            </div>
          </header>
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
