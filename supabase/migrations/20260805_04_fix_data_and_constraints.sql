-- Correctifs données et contraintes INFINITY ITAM

-- Normaliser les anciens statuts incorrects
UPDATE public.materiels
SET statut = 'Stock'
WHERE statut = 'Disponible';

-- Empêcher deux attributions actives sur le même matériel
CREATE UNIQUE INDEX IF NOT EXISTS idx_attributions_one_active_per_materiel
ON public.attributions (materiel_id)
WHERE statut = 'Actif' AND materiel_id IS NOT NULL;

-- Policies RLS pour les tables RBAC (activées par migration 01 sans policies)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['comptes_systeme', 'comptes_roles', 'roles']
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

COMMENT ON INDEX public.idx_attributions_one_active_per_materiel IS 'Une seule attribution active par matériel';
