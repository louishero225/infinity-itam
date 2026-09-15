-- Flotte téléphonique Orange — numéros, attributions, demandes

CREATE TABLE IF NOT EXISTS public.demandes_flotte_orange (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_orange text,
  statut text NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon', 'soumise', 'en_cours', 'livree', 'annulee')),
  quantite integer NOT NULL DEFAULT 1 CHECK (quantite > 0),
  motif text,
  demandeur_interne text,
  date_demande date NOT NULL DEFAULT CURRENT_DATE,
  date_livraison_prevue date,
  date_livraison_effective date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.numeros_flotte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  numero_normalise text NOT NULL,
  statut text NOT NULL DEFAULT 'attribue'
    CHECK (statut IN ('attribue', 'disponible', 'reserve', 'desactive', 'en_commande')),
  operateur text NOT NULL DEFAULT 'Orange',
  employe_id uuid REFERENCES public.employes(id) ON DELETE SET NULL,
  titulaire_libre text,
  fonction text,
  departement text,
  date_attribution date,
  date_liberation date,
  demande_orange_id uuid REFERENCES public.demandes_flotte_orange(id) ON DELETE SET NULL,
  notes text,
  source text NOT NULL DEFAULT 'saisie',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_numeros_flotte_normalise UNIQUE (numero_normalise)
);

CREATE INDEX IF NOT EXISTS idx_numeros_flotte_statut ON public.numeros_flotte (statut);
CREATE INDEX IF NOT EXISTS idx_numeros_flotte_employe ON public.numeros_flotte (employe_id);
CREATE INDEX IF NOT EXISTS idx_numeros_flotte_departement ON public.numeros_flotte (departement);
CREATE INDEX IF NOT EXISTS idx_demandes_flotte_statut ON public.demandes_flotte_orange (statut);

CREATE TABLE IF NOT EXISTS public.numeros_flotte_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_flotte_id uuid NOT NULL REFERENCES public.numeros_flotte(id) ON DELETE CASCADE,
  employe_id uuid REFERENCES public.employes(id) ON DELETE SET NULL,
  titulaire_libre text,
  departement text,
  fonction text,
  date_debut date NOT NULL,
  date_fin date,
  motif text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flotte_hist_numero ON public.numeros_flotte_historique (numero_flotte_id, date_debut DESC);

ALTER TABLE public.demandes_flotte_orange ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numeros_flotte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numeros_flotte_historique ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS itam_select ON public.demandes_flotte_orange;
DROP POLICY IF EXISTS itam_insert ON public.demandes_flotte_orange;
DROP POLICY IF EXISTS itam_update ON public.demandes_flotte_orange;
DROP POLICY IF EXISTS itam_delete ON public.demandes_flotte_orange;

CREATE POLICY itam_select ON public.demandes_flotte_orange FOR SELECT TO authenticated USING (public.is_itam_user());
CREATE POLICY itam_insert ON public.demandes_flotte_orange FOR INSERT TO authenticated WITH CHECK (public.is_itam_user());
CREATE POLICY itam_update ON public.demandes_flotte_orange FOR UPDATE TO authenticated USING (public.is_itam_user()) WITH CHECK (public.is_itam_user());
CREATE POLICY itam_delete ON public.demandes_flotte_orange FOR DELETE TO authenticated USING (public.is_itam_user());

DROP POLICY IF EXISTS itam_select ON public.numeros_flotte;
DROP POLICY IF EXISTS itam_insert ON public.numeros_flotte;
DROP POLICY IF EXISTS itam_update ON public.numeros_flotte;
DROP POLICY IF EXISTS itam_delete ON public.numeros_flotte;

CREATE POLICY itam_select ON public.numeros_flotte FOR SELECT TO authenticated USING (public.is_itam_user());
CREATE POLICY itam_insert ON public.numeros_flotte FOR INSERT TO authenticated WITH CHECK (public.is_itam_user());
CREATE POLICY itam_update ON public.numeros_flotte FOR UPDATE TO authenticated USING (public.is_itam_user()) WITH CHECK (public.is_itam_user());
CREATE POLICY itam_delete ON public.numeros_flotte FOR DELETE TO authenticated USING (public.is_itam_user());

DROP POLICY IF EXISTS itam_select ON public.numeros_flotte_historique;
DROP POLICY IF EXISTS itam_insert ON public.numeros_flotte_historique;
DROP POLICY IF EXISTS itam_update ON public.numeros_flotte_historique;
DROP POLICY IF EXISTS itam_delete ON public.numeros_flotte_historique;

CREATE POLICY itam_select ON public.numeros_flotte_historique FOR SELECT TO authenticated USING (public.is_itam_user());
CREATE POLICY itam_insert ON public.numeros_flotte_historique FOR INSERT TO authenticated WITH CHECK (public.is_itam_user());
CREATE POLICY itam_update ON public.numeros_flotte_historique FOR UPDATE TO authenticated USING (public.is_itam_user()) WITH CHECK (public.is_itam_user());
CREATE POLICY itam_delete ON public.numeros_flotte_historique FOR DELETE TO authenticated USING (public.is_itam_user());

CREATE OR REPLACE FUNCTION public.flotte_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_demandes_flotte_updated ON public.demandes_flotte_orange;
CREATE TRIGGER trg_demandes_flotte_updated
BEFORE UPDATE ON public.demandes_flotte_orange
FOR EACH ROW EXECUTE FUNCTION public.flotte_set_updated_at();

DROP TRIGGER IF EXISTS trg_numeros_flotte_updated ON public.numeros_flotte;
CREATE TRIGGER trg_numeros_flotte_updated
BEFORE UPDATE ON public.numeros_flotte
FOR EACH ROW EXECUTE FUNCTION public.flotte_set_updated_at();
