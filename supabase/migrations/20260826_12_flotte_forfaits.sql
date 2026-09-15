-- Forfaits mensuels Orange (HT facture / TTC alloué)

ALTER TABLE public.numeros_flotte
  ADD COLUMN IF NOT EXISTS formule text
    CHECK (formule IS NULL OR formule IN ('mix_3', 'mix_5')),
  ADD COLUMN IF NOT EXISTS montant_ht integer
    CHECK (montant_ht IS NULL OR montant_ht >= 0),
  ADD COLUMN IF NOT EXISTS montant_ttc integer
    CHECK (montant_ttc IS NULL OR montant_ttc >= 0);

COMMENT ON COLUMN public.numeros_flotte.formule IS 'Forfait Orange: mix_3 (2 500 TTC) ou mix_5 (5 000 TTC)';
COMMENT ON COLUMN public.numeros_flotte.montant_ht IS 'Montant mensuel HT (FCFA) tel que facturé Orange';
COMMENT ON COLUMN public.numeros_flotte.montant_ttc IS 'Montant mensuel TTC alloué (FCFA): 2500 ou 5000';
