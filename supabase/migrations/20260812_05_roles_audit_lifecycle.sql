-- Rôles, journal d'audit, prêts, cycle de vie, pièces jointes

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

CREATE UNIQUE INDEX IF NOT EXISTS roles_code_key ON public.roles (code);

INSERT INTO public.roles (code)
VALUES ('admin'), ('itam'), ('lecture')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.attributions
  ADD COLUMN IF NOT EXISTS date_retour_prevue date,
  ADD COLUMN IF NOT EXISTS type_attribution text NOT NULL DEFAULT 'standard';

ALTER TABLE public.attributions
  DROP CONSTRAINT IF EXISTS attributions_type_attribution_check;

ALTER TABLE public.attributions
  ADD CONSTRAINT attributions_type_attribution_check
  CHECK (type_attribution IN ('standard', 'pret'));

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.pieces_jointes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  nom_fichier text NOT NULL,
  mime_type text,
  taille_octets integer,
  storage_path text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pieces_jointes_entity
  ON public.pieces_jointes (entity_type, entity_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pieces_jointes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS itam_select ON public.audit_log;
DROP POLICY IF EXISTS itam_insert ON public.audit_log;
CREATE POLICY itam_select ON public.audit_log
  FOR SELECT TO authenticated USING (public.is_itam_user());
CREATE POLICY itam_insert ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_itam_user());

DROP POLICY IF EXISTS itam_select ON public.pieces_jointes;
DROP POLICY IF EXISTS itam_insert ON public.pieces_jointes;
DROP POLICY IF EXISTS itam_delete ON public.pieces_jointes;
CREATE POLICY itam_select ON public.pieces_jointes
  FOR SELECT TO authenticated USING (public.is_itam_user());
CREATE POLICY itam_insert ON public.pieces_jointes
  FOR INSERT TO authenticated WITH CHECK (public.is_itam_user());
CREATE POLICY itam_delete ON public.pieces_jointes
  FOR DELETE TO authenticated USING (public.is_itam_user());

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('itam-fichiers', 'itam-fichiers', false)
  ON CONFLICT (id) DO NOTHING;

  DROP POLICY IF EXISTS itam_storage_select ON storage.objects;
  DROP POLICY IF EXISTS itam_storage_insert ON storage.objects;
  DROP POLICY IF EXISTS itam_storage_delete ON storage.objects;

  CREATE POLICY itam_storage_select ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'itam-fichiers' AND public.is_itam_user());

  CREATE POLICY itam_storage_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'itam-fichiers' AND public.is_itam_user());

  CREATE POLICY itam_storage_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'itam-fichiers' AND public.is_itam_user());
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN undefined_function THEN
    NULL;
  WHEN insufficient_privilege THEN
    NULL;
END $$;

COMMENT ON TABLE public.audit_log IS 'Journal des actions sensibles ITAM';
COMMENT ON COLUMN public.attributions.date_retour_prevue IS 'Date de retour prévue pour un prêt temporaire';
