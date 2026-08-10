"use client";

import { LogOut } from "lucide-react";

import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-3 px-3">
        <LogOut className="size-4" />
        Déconnexion
      </Button>
    </form>
  );
}
