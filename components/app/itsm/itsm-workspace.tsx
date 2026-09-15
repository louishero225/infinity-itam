"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Columns3, ListTodo, PlusCircle, Wrench } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Props = {
  liste: React.ReactNode;
  kanban: React.ReactNode;
  nouveau: React.ReactNode;
  outils: React.ReactNode;
};

const VALID_TABS = ["liste", "kanban", "nouveau", "outils"] as const;
type TabId = (typeof VALID_TABS)[number];

export function ItsmWorkspace({ liste, kanban, nouveau, outils }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab: TabId = VALID_TABS.includes(tabParam as TabId)
    ? (tabParam as TabId)
    : "liste";

  return (
    <Tabs defaultValue={defaultTab} className="gap-4">
      <TabsList className="bg-muted/60 h-auto w-full flex-wrap justify-start gap-1 rounded-xl p-1 sm:w-auto">
        <TabsTrigger
          value="liste"
          className={cn(
            "data-[state=active]:bg-background gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-sm"
          )}
        >
          <ListTodo className="size-4" />
          File
        </TabsTrigger>
        <TabsTrigger
          value="kanban"
          className="data-[state=active]:bg-background gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-sm"
        >
          <Columns3 className="size-4" />
          Kanban
        </TabsTrigger>
        <TabsTrigger
          value="nouveau"
          className="data-[state=active]:bg-background gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-sm"
        >
          <PlusCircle className="size-4" />
          Créer
        </TabsTrigger>
        <TabsTrigger
          value="outils"
          className="data-[state=active]:bg-background gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-sm"
        >
          <Wrench className="size-4" />
          Ops
        </TabsTrigger>
      </TabsList>

      <TabsContent value="liste" className="mt-0 outline-none">
        {liste}
      </TabsContent>
      <TabsContent value="kanban" className="mt-0 outline-none">
        {kanban}
      </TabsContent>
      <TabsContent value="nouveau" className="mt-0 outline-none">
        {nouveau}
      </TabsContent>
      <TabsContent value="outils" className="mt-0 outline-none">
        {outils}
      </TabsContent>
    </Tabs>
  );
}
