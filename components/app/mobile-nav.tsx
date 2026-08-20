"use client";

import * as React from "react";
import { MenuIcon } from "lucide-react";

import { AppBrand } from "@/components/app/app-brand";
import { LogoutButton } from "@/components/app/logout-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/app/sidebar";
import { APP_NAME } from "@/lib/navigation";

export function MobileNav() {
  return (
    <div className="flex items-center gap-3">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <MenuIcon className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="border-b p-4">
            <SheetHeader>
              <SheetTitle className="sr-only">{APP_NAME}</SheetTitle>
            </SheetHeader>
            <AppBrand compact />
          </div>
          <div className="overflow-y-auto px-3 py-4">
            <SidebarNav />
            <div className="mt-4 border-t pt-4">
              <LogoutButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div className="text-sm font-semibold md:hidden">{APP_NAME}</div>
    </div>
  );
}
