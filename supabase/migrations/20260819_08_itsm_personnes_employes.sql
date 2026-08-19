-- Lien demandeurs / tickets ITSM ↔ employés ITAM

ALTER TABLE public.demandeurs
  ADD COLUMN IF NOT EXISTS employe_id uuid REFERENCES public.employes(id) ON DELETE SET NULL;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS employe_id uuid REFERENCES public.employes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_demandeurs_employe ON public.demandeurs (employe_id);
CREATE INDEX IF NOT EXISTS idx_tickets_employe ON public.tickets (employe_id);
