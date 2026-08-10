-- Correctif : créer is_itam_user() si la migration 02 a été appliquée sans la 01

CREATE OR REPLACE FUNCTION public.is_itam_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
  AND (
    NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'comptes_systeme'
    )
    OR NOT EXISTS (SELECT 1 FROM public.comptes_systeme)
    OR EXISTS (SELECT 1 FROM public.comptes_systeme WHERE id = auth.uid())
  );
$$;

COMMENT ON FUNCTION public.is_itam_user() IS 'Vérifie que l''utilisateur auth est enregistré dans comptes_systeme (si la table existe)';
