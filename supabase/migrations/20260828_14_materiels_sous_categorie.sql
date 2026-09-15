-- Sous-catégories accessoires (Souris, Chargeur, Casque…)

ALTER TABLE public.materiels
  ADD COLUMN IF NOT EXISTS sous_categorie text;

CREATE INDEX IF NOT EXISTS idx_materiels_sous_categorie
  ON public.materiels (sous_categorie)
  WHERE sous_categorie IS NOT NULL;

COMMENT ON COLUMN public.materiels.sous_categorie IS
  'Sous-catégorie (surtout pour type Accessoire): Souris, Clavier, Chargeur, Casque, Hub / Dock, Câble, Sacoche, Webcam, Adaptateur, Autre';
