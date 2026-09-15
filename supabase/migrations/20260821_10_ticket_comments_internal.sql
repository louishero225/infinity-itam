-- Commentaires internes (notes agents, non visibles côté demandeur / non notifiés)
ALTER TABLE public.ticket_comments
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ticket_comments_internal
  ON public.ticket_comments (ticket_id, is_internal);
