-- Référentiel des entités / départements destinataires de matériel

CREATE TABLE IF NOT EXISTS entites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'departement'
    CHECK (type IN ('departement', 'societe', 'site')),
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_entite_code ON entites (code);
CREATE INDEX IF NOT EXISTS idx_entites_type ON entites (type);
CREATE INDEX IF NOT EXISTS idx_entites_actif ON entites (actif);

COMMENT ON TABLE entites IS 'Départements, sociétés et sites pouvant recevoir du matériel (destinataires non-personnes)';

ALTER TABLE attributions
  ADD COLUMN IF NOT EXISTS entite_id UUID REFERENCES entites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attributions_entite ON attributions(entite_id);

-- Entités IAG courantes
INSERT INTO entites (code, nom, type) VALUES
  ('IT', 'IT', 'departement'),
  ('IAG', 'Infinity Africa Group', 'societe'),
  ('IAT', 'Infinity Africa Technologies', 'societe'),
  ('IAP', 'Infinity Africa Partners', 'societe'),
  ('IAC', 'Infinity Africa Capital', 'societe'),
  ('IAF', 'Infinity Africa Finance', 'societe'),
  ('RH', 'Ressources Humaines', 'departement'),
  ('COMPTA', 'Comptabilité', 'departement'),
  ('DIRECTION', 'Direction', 'departement')
ON CONFLICT (code) DO NOTHING;
