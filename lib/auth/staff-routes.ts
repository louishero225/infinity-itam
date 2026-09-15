/** Préfixes des routes réservées au staff ITAM / IT (hors portail collaborateur). */
export const STAFF_ROUTE_PREFIXES = [
  "/dashboard",
  "/itsm",
  "/employes",
  "/materiels",
  "/destinataires",
  "/attributions",
  "/achats",
  "/alertes",
  "/licences",
  "/reparations",
  "/flotte",
  "/historique",
  "/parc",
  "/rapports",
] as const;

export const ADMIN_ROUTE_PREFIXES = ["/audit", "/administration"] as const;

export function isStaffRoute(pathname: string) {
  return STAFF_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAdminRoute(pathname: string) {
  return ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
