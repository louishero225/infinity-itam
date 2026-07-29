-- Fix: Ajouter colonne "action" à la vue v_historique_attributions
-- Cette vue permet de filtrer par Attribution ou Restitution

DROP VIEW IF EXISTS v_historique_attributions;

CREATE OR REPLACE VIEW v_historique_attributions AS
SELECT 
  a.id,
  m.code_materiel,
  e.nom,
  e.prenom,
  e.departement,
  a.date_attribution,
  a.date_restitution,
  a.statut,
  -- Colonne action calculée
  CASE 
    WHEN a.date_restitution IS NULL THEN 'Attribution'
    ELSE 'Restitution'
  END AS action,
  -- Date_action pour le tri (attribution ou restitution selon le cas)
  COALESCE(a.date_restitution, a.date_attribution) AS date_action
FROM attributions a
LEFT JOIN materiels m ON a.materiel_id = m.id
LEFT JOIN employes e ON a.employe_id = e.id
ORDER BY COALESCE(a.date_restitution, a.date_attribution) DESC;

COMMENT ON VIEW v_historique_attributions IS 'Historique complet des attributions et restitutions avec colonne action pour filtrage';
