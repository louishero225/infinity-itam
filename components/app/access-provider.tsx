"use client";

import * as React from "react";
import type { RoleCode } from "@/lib/auth/role-types";

type AccessValue = {
  canWrite: boolean;
  canAdmin: boolean;
  roles: RoleCode[];
};

const AccessContext = React.createContext<AccessValue>({
  canWrite: true,
  canAdmin: true,
  roles: ["admin", "itam"],
});

export function AccessProvider({
  value,
  children,
}: {
  value: AccessValue;
  children: React.ReactNode;
}) {
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  return React.useContext(AccessContext);
}
