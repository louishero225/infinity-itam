-- Row Level Security pour INFINITY ITAM
-- Accès réservé aux utilisateurs authentifiés Supabase Auth

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'materiels',
    'employes',
    'attributions',
    'entites',
    'alertes',
    'licences',
    'reparations',
    'demandes_achat',
    'categories_images',
    'comptes_systeme',
    'comptes_roles',
    'roles'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

-- Policies : utilisateurs authentifiés (lecture + écriture)
-- Les comptes_systeme permettent un contrôle RBAC futur via has_role()

CREATE OR REPLACE FUNCTION public.is_itam_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
  AND (
    NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comptes_systeme')
    OR NOT EXISTS (SELECT 1 FROM public.comptes_systeme)
    OR EXISTS (SELECT 1 FROM public.comptes_systeme WHERE id = auth.uid())
  );
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'materiels',
    'employes',
    'attributions',
    'entites',
    'alertes',
    'licences',
    'reparations',
    'demandes_achat',
    'categories_images'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS itam_select ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS itam_insert ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS itam_update ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS itam_delete ON public.%I', tbl);

      EXECUTE format(
        'CREATE POLICY itam_select ON public.%I FOR SELECT TO authenticated USING (public.is_itam_user())',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY itam_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_itam_user())',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY itam_update ON public.%I FOR UPDATE TO authenticated USING (public.is_itam_user()) WITH CHECK (public.is_itam_user())',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY itam_delete ON public.%I FOR DELETE TO authenticated USING (public.is_itam_user())',
        tbl
      );
    END IF;
  END LOOP;
END $$;

COMMENT ON FUNCTION public.is_itam_user() IS 'Vérifie que l''utilisateur auth est enregistré dans comptes_systeme (si la table existe)';
