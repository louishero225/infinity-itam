-- Portail collaborateurs : email employé + rôle collaborateur

ALTER TABLE public.employes
  ADD COLUMN IF NOT EXISTS email text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employes_email_unique
  ON public.employes (lower(email))
  WHERE email IS NOT NULL AND btrim(email) <> '';

INSERT INTO public.roles (code)
VALUES ('collaborateur')
ON CONFLICT (code) DO NOTHING;
