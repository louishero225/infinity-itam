-- Migration: Ajouter gestionnaire pour les licences et améliorer les alertes
-- Date: 2026-01-13

-- 1. Ajouter colonne gestionnaire_id
ALTER TABLE licences
ADD COLUMN IF NOT EXISTS gestionnaire_id UUID REFERENCES employes(id) ON DELETE SET NULL;

-- 2. Créer index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_licences_gestionnaire ON licences(gestionnaire_id);
CREATE INDEX IF NOT EXISTS idx_licences_date_expiration ON licences(date_expiration);
CREATE INDEX IF NOT EXISTS idx_licences_statut ON licences(statut);

-- 3. Créer une vue pour les licences proches de l'expiration
CREATE OR REPLACE VIEW v_licences_alertes AS
SELECT 
  l.id,
  l.nom,
  l.editeur,
  l.date_expiration,
  l.cout,
  l.statut,
  e.prenom as gestionnaire_prenom,
  e.nom as gestionnaire_nom,
  e.email as gestionnaire_email,
  -- Calculer le nombre de jours avant expiration
  CASE 
    WHEN l.date_expiration IS NULL THEN NULL
    ELSE l.date_expiration - CURRENT_DATE
  END AS jours_avant_expiration,
  -- Définir le niveau d'urgence
  CASE 
    WHEN l.date_expiration IS NULL THEN 'Aucune'
    WHEN l.date_expiration < CURRENT_DATE THEN 'Expirée'
    WHEN l.date_expiration <= CURRENT_DATE + INTERVAL '7 days' THEN 'Critique'
    WHEN l.date_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'Urgent'
    WHEN l.date_expiration <= CURRENT_DATE + INTERVAL '60 days' THEN 'Attention'
    ELSE 'Normal'
  END AS niveau_urgence
FROM licences l
LEFT JOIN employes e ON l.gestionnaire_id = e.id
WHERE l.statut = 'Active'
  AND l.date_expiration IS NOT NULL
ORDER BY l.date_expiration ASC;

-- Commentaires
COMMENT ON COLUMN licences.gestionnaire_id IS 'Employé responsable de la gestion de l''abonnement';
COMMENT ON VIEW v_licences_alertes IS 'Vue pour les alertes de renouvellement de licences avec niveaux d''urgence';
