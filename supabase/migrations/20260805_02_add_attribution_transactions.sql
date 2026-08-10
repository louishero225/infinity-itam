-- Opérations transactionnelles attribution / restitution
-- Dépend de is_itam_user() (créée ici si absente)

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

CREATE OR REPLACE FUNCTION public.create_attribution_transaction(  p_materiel_id UUID,
  p_employe_id UUID,
  p_entite_id UUID,
  p_beneficiaire_type TEXT,
  p_beneficiaire_label TEXT,
  p_date_attribution DATE,
  p_commentaire TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attribution_id UUID;
  v_numero TEXT;
BEGIN
  IF NOT public.is_itam_user() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  v_numero := generate_numero_attribution();

  INSERT INTO attributions (
    materiel_id,
    employe_id,
    entite_id,
    date_attribution,
    statut,
    numero_attribution,
    beneficiaire_type,
    beneficiaire_label,
    commentaire
  ) VALUES (
    p_materiel_id,
    p_employe_id,
    p_entite_id,
    p_date_attribution,
    'Actif',
    v_numero,
    p_beneficiaire_type,
    p_beneficiaire_label,
    p_commentaire
  )
  RETURNING id INTO v_attribution_id;

  UPDATE materiels
  SET statut = 'Attribué'
  WHERE id = p_materiel_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matériel introuvable: %', p_materiel_id;
  END IF;

  RETURN v_attribution_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restituer_attribution_transaction(
  p_attribution_id UUID,
  p_materiel_id UUID,
  p_etat_restitution TEXT DEFAULT NULL,
  p_commentaire TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_itam_user() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  UPDATE attributions
  SET
    statut = 'Restitué',
    date_restitution = CURRENT_DATE,
    etat_restitution = p_etat_restitution,
    commentaire = COALESCE(p_commentaire, commentaire)
  WHERE id = p_attribution_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attribution introuvable: %', p_attribution_id;
  END IF;

  UPDATE materiels
  SET statut = 'Stock'
  WHERE id = p_materiel_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matériel introuvable: %', p_materiel_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.create_attribution_transaction IS 'Crée une attribution et met à jour le statut matériel en une transaction';
COMMENT ON FUNCTION public.restituer_attribution_transaction IS 'Restitue une attribution et remet le matériel en stock en une transaction';

GRANT EXECUTE ON FUNCTION public.create_attribution_transaction(
  UUID, UUID, UUID, TEXT, TEXT, DATE, TEXT
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.restituer_attribution_transaction(
  UUID, UUID, TEXT, TEXT
) TO authenticated;
