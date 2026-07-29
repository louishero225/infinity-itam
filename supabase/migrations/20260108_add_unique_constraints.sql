-- Migration: Ajouter contraintes d'unicité pour améliorer l'intégrité des données
-- Date: 2026-01-08

-- 1. Contrainte d'unicité sur le code matériel
-- Empêche les doublons de codes matériel
ALTER TABLE materiels 
ADD CONSTRAINT unique_code_materiel UNIQUE (code_materiel);

-- 2. Contrainte d'unicité sur le numéro de série (si renseigné)
-- Permet NULL mais empêche les doublons pour les valeurs non-NULL
-- Note: CREATE UNIQUE INDEX avec WHERE clause permet plusieurs NULL
CREATE UNIQUE INDEX IF NOT EXISTS unique_numero_serie 
  ON materiels(numero_serie) 
  WHERE numero_serie IS NOT NULL;

-- 3. Contrainte d'unicité sur le matricule employé (si renseigné)
-- Permet NULL mais empêche les doublons pour les valeurs non-NULL
ALTER TABLE employes 
ADD CONSTRAINT unique_matricule UNIQUE NULLS NOT DISTINCT (matricule);

-- 4. Index pour améliorer les performances des recherches
CREATE INDEX IF NOT EXISTS idx_materiels_code ON materiels(code_materiel);
CREATE INDEX IF NOT EXISTS idx_materiels_type ON materiels(type);
CREATE INDEX IF NOT EXISTS idx_materiels_statut ON materiels(statut);
CREATE INDEX IF NOT EXISTS idx_employes_nom ON employes(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_attributions_statut ON attributions(statut);
CREATE INDEX IF NOT EXISTS idx_attributions_dates ON attributions(date_attribution, date_restitution);

-- Commentaires pour documentation
COMMENT ON CONSTRAINT unique_code_materiel ON materiels IS 
  'Garantit que chaque matériel a un code unique dans le système';
COMMENT ON CONSTRAINT unique_numero_serie ON materiels IS 
  'Garantit que chaque numéro de série est unique (si renseigné)';
COMMENT ON CONSTRAINT unique_matricule ON employes IS 
  'Garantit que chaque matricule employé est unique (si renseigné)';
