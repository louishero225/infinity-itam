import * as React from "react";

import { MobileNav } from "@/components/app/mobile-nav";
import { SidebarNav } from "@/components/app/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-screen-2xl">
        <aside className="hidden w-64 shrink-0 border-r bg-sidebar p-4 md:block">
          <div className="mb-4 text-sm font-semibold">INFINITY ITAM</div>
          <SidebarNav />
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
