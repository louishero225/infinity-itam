-- Lecture + écriture des comptes/rôles pour utilisateurs ITAM authentifiés
-- (l’écran admin reste protégé côté app via requireAdmin)

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptes_systeme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptes_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_select ON public.roles;
CREATE POLICY roles_select ON public.roles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS comptes_systeme_select ON public.comptes_systeme;
DROP POLICY IF EXISTS comptes_systeme_insert ON public.comptes_systeme;
DROP POLICY IF EXISTS comptes_systeme_update ON public.comptes_systeme;
DROP POLICY IF EXISTS comptes_systeme_delete ON public.comptes_systeme;
CREATE POLICY comptes_systeme_select ON public.comptes_systeme
  FOR SELECT TO authenticated USING (public.is_itam_user());
CREATE POLICY comptes_systeme_insert ON public.comptes_systeme
  FOR INSERT TO authenticated WITH CHECK (public.is_itam_user());
CREATE POLICY comptes_systeme_update ON public.comptes_systeme
  FOR UPDATE TO authenticated USING (public.is_itam_user()) WITH CHECK (public.is_itam_user());
CREATE POLICY comptes_systeme_delete ON public.comptes_systeme
  FOR DELETE TO authenticated USING (public.is_itam_user());

DROP POLICY IF EXISTS comptes_roles_select ON public.comptes_roles;
DROP POLICY IF EXISTS comptes_roles_insert ON public.comptes_roles;
DROP POLICY IF EXISTS comptes_roles_update ON public.comptes_roles;
DROP POLICY IF EXISTS comptes_roles_delete ON public.comptes_roles;
CREATE POLICY comptes_roles_select ON public.comptes_roles
  FOR SELECT TO authenticated USING (public.is_itam_user());
CREATE POLICY comptes_roles_insert ON public.comptes_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_itam_user());
CREATE POLICY comptes_roles_update ON public.comptes_roles
  FOR UPDATE TO authenticated USING (public.is_itam_user()) WITH CHECK (public.is_itam_user());
CREATE POLICY comptes_roles_delete ON public.comptes_roles
  FOR DELETE TO authenticated USING (public.is_itam_user());
