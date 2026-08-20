"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { List, Plus, Wrench } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  liste: React.ReactNode;
  nouveau: React.ReactNode;
  outils: React.ReactNode;
};

const VALID_TABS = ["liste", "nouveau", "outils"] as const;
type TabId = (typeof VALID_TABS)[number];

export function ItsmWorkspace({ liste, nouveau, outils }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab: TabId = VALID_TABS.includes(tabParam as TabId)
    ? (tabParam as TabId)
    : "liste";

  return (
    <Tabs defaultValue={defaultTab} className="gap-6">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 sm:w-auto">
        <TabsTrigger value="liste" className="gap-1.5 px-4">
          <List className="size-4" />
          Tickets
        </TabsTrigger>
        <TabsTrigger value="nouveau" className="gap-1.5 px-4">
          <Plus className="size-4" />
          Nouveau
        </TabsTrigger>
        <TabsTrigger value="outils" className="gap-1.5 px-4">
          <Wrench className="size-4" />
          Outils
        </TabsTrigger>
      </TabsList>

      <TabsContent value="liste" className="mt-0">
        {liste}
      </TabsContent>
      <TabsContent value="nouveau" className="mt-0">
        {nouveau}
      </TabsContent>
      <TabsContent value="outils" className="mt-0">
        {outils}
      </TabsContent>
    </Tabs>
  );
}
