-- ITSM (Support IT) — tickets, commentaires, faits marquants, demandeurs
-- V1 : sécurité via RLS + public.is_itam_user()

-- Pour les UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Roles / policies utilisent public.is_itam_user() (défini dans 20260812_05)

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'saisie' CHECK (source IN ('export', 'saisie')),
  approx_time boolean NOT NULL DEFAULT false,
  date date NOT NULL,
  heure_creation time without time zone NOT NULL,
  demandeur text NOT NULL,
  entite text NOT NULL DEFAULT '',
  categorie text NOT NULL DEFAULT 'Non catégorisé',
  canal text NOT NULL DEFAULT '',
  sous_canal text,
  ticket_ref text,
  technicien text NOT NULL DEFAULT '',
  statut text NOT NULL DEFAULT 'Ouvert' CHECK (statut IN ('Ouvert', 'En cours', 'Résolu', 'Fermé')),
  priorite text NOT NULL DEFAULT 'Non défini',
  en_retard boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_statut ON public.tickets (statut);
CREATE INDEX IF NOT EXISTS idx_tickets_date ON public.tickets (date DESC, heure_creation DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_entite ON public.tickets (entite);
CREATE INDEX IF NOT EXISTS idx_tickets_categorie ON public.tickets (categorie);
CREATE INDEX IF NOT EXISTS idx_tickets_en_retard ON public.tickets (en_retard);

-- Dédup import ManageEngine
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tickets_ticket_ref
  ON public.tickets (ticket_ref)
  WHERE ticket_ref IS NOT NULL AND ticket_ref <> '';

-- Historique : commentaires (et timeline via audit_log côté app pour la V1)
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  contenu text NOT NULL,
  created_by uuid,
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON public.ticket_comments (ticket_id, created_at DESC);

-- Faits marquants
CREATE TABLE IF NOT EXISTS public.faits_marquants (
  date date PRIMARY KEY,
  note text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Annuaire demandeurs (autocomplete)
CREATE TABLE IF NOT EXISTS public.demandeurs (
  name text PRIMARY KEY,
  source text NOT NULL DEFAULT 'saisie',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faits_marquants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandeurs ENABLE ROW LEVEL SECURITY;

-- Policies : V1, tout user ITAM (public.is_itam_user()) peut lire/écrire.
-- Le contrôle “qui peut fermer/éditer” se fera aussi côté app (requireWrite).

DROP POLICY IF EXISTS itsm_tickets_select ON public.tickets;
DROP POLICY IF EXISTS itsm_tickets_insert ON public.tickets;
DROP POLICY IF EXISTS itsm_tickets_update ON public.tickets;
DROP POLICY IF EXISTS itsm_tickets_delete ON public.tickets;

CREATE POLICY itsm_tickets_select ON public.tickets
  FOR SELECT TO authenticated
  USING (public.is_itam_user());

CREATE POLICY itsm_tickets_insert ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (public.is_itam_user());

CREATE POLICY itsm_tickets_update ON public.tickets
  FOR UPDATE TO authenticated
  USING (public.is_itam_user())
  WITH CHECK (public.is_itam_user());

CREATE POLICY itsm_tickets_delete ON public.tickets
  FOR DELETE TO authenticated
  USING (public.is_itam_user());

DROP POLICY IF EXISTS itsm_ticket_comments_select ON public.ticket_comments;
DROP POLICY IF EXISTS itsm_ticket_comments_insert ON public.ticket_comments;
DROP POLICY IF EXISTS itsm_ticket_comments_update ON public.ticket_comments;
DROP POLICY IF EXISTS itsm_ticket_comments_delete ON public.ticket_comments;

CREATE POLICY itsm_ticket_comments_select ON public.ticket_comments
  FOR SELECT TO authenticated
  USING (public.is_itam_user());

CREATE POLICY itsm_ticket_comments_insert ON public.ticket_comments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_itam_user());

CREATE POLICY itsm_ticket_comments_update ON public.ticket_comments
  FOR UPDATE TO authenticated
  USING (public.is_itam_user())
  WITH CHECK (public.is_itam_user());

CREATE POLICY itsm_ticket_comments_delete ON public.ticket_comments
  FOR DELETE TO authenticated
  USING (public.is_itam_user());

DROP POLICY IF EXISTS itsm_faits_select ON public.faits_marquants;
DROP POLICY IF EXISTS itsm_faits_insert ON public.faits_marquants;
DROP POLICY IF EXISTS itsm_faits_update ON public.faits_marquants;
DROP POLICY IF EXISTS itsm_faits_delete ON public.faits_marquants;

CREATE POLICY itsm_faits_select ON public.faits_marquants
  FOR SELECT TO authenticated
  USING (public.is_itam_user());

CREATE POLICY itsm_faits_insert ON public.faits_marquants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_itam_user());

CREATE POLICY itsm_faits_update ON public.faits_marquants
  FOR UPDATE TO authenticated
  USING (public.is_itam_user())
  WITH CHECK (public.is_itam_user());

CREATE POLICY itsm_faits_delete ON public.faits_marquants
  FOR DELETE TO authenticated
  USING (public.is_itam_user());

DROP POLICY IF EXISTS itsm_demandeurs_select ON public.demandeurs;
DROP POLICY IF EXISTS itsm_demandeurs_insert ON public.demandeurs;
DROP POLICY IF EXISTS itsm_demandeurs_update ON public.demandeurs;
DROP POLICY IF EXISTS itsm_demandeurs_delete ON public.demandeurs;

CREATE POLICY itsm_demandeurs_select ON public.demandeurs
  FOR SELECT TO authenticated
  USING (public.is_itam_user());

CREATE POLICY itsm_demandeurs_insert ON public.demandeurs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_itam_user());

CREATE POLICY itsm_demandeurs_update ON public.demandeurs
  FOR UPDATE TO authenticated
  USING (public.is_itam_user())
  WITH CHECK (public.is_itam_user());

CREATE POLICY itsm_demandeurs_delete ON public.demandeurs
  FOR DELETE TO authenticated
  USING (public.is_itam_user());

-- MàJ updated_at
CREATE OR REPLACE FUNCTION public.tickets_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tickets_updated_at ON public.tickets;
CREATE TRIGGER trg_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.tickets_set_updated_at();

