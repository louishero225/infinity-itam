"use client";

import * as React from "react";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/app/sidebar";

export function MobileNav({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <MenuIcon className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <div className="p-4">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
          </div>
          <div className="px-3 pb-4">
            <SidebarNav />
          </div>
        </SheetContent>
      </Sheet>
      <div className="text-sm font-semibold md:hidden">{title}</div>
    </div>
  );
}
