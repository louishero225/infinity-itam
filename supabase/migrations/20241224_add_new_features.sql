-- Migration pour nouvelles fonctionnalités ITAM
-- 1. Assignation salle pour matériels
-- 2. Gestion des alertes
-- 3. Catégorie Licences
-- 4. Suivi réparations
-- 5. Photos matériels et images catégories

-- ============================================
-- 1. Ajouter colonnes à la table materiels
-- ============================================

-- Colonne salle pour assignation précise
ALTER TABLE materiels ADD COLUMN IF NOT EXISTS salle TEXT;

-- Colonne photo_url pour image du matériel
ALTER TABLE materiels ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Ajout champs additionnels utiles
ALTER TABLE materiels ADD COLUMN IF NOT EXISTS nom_device TEXT;
ALTER TABLE materiels ADD COLUMN IF NOT EXISTS adresse_mac TEXT;
ALTER TABLE materiels ADD COLUMN IF NOT EXISTS adresse_ip TEXT;
ALTER TABLE materiels ADD COLUMN IF NOT EXISTS observations TEXT;

COMMENT ON COLUMN materiels.salle IS 'Localisation précise (ex: Bâtiment A - Étage 2 - Bureau 205)';
COMMENT ON COLUMN materiels.photo_url IS 'URL de la photo du matériel stockée dans Supabase Storage';

-- ============================================
-- 2. Table ALERTES
-- ============================================

CREATE TABLE IF NOT EXISTS alertes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('maintenance', 'garantie', 'renouvellement', 'reparation', 'autre')),
  titre TEXT NOT NULL,
  description TEXT,
  priorite TEXT NOT NULL DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'critique')),
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'traitee', 'ignoree')),
  date_echeance DATE,
  materiel_id UUID REFERENCES materiels(id) ON DELETE CASCADE,
  licence_id UUID, -- sera lié après création table licences
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  traitee_par UUID, -- id de l'utilisateur qui a traité l'alerte
  traitee_le TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alertes_statut ON alertes(statut);
CREATE INDEX IF NOT EXISTS idx_alertes_type ON alertes(type);
CREATE INDEX IF NOT EXISTS idx_alertes_materiel ON alertes(materiel_id);
CREATE INDEX IF NOT EXISTS idx_alertes_licence ON alertes(licence_id);
CREATE INDEX IF NOT EXISTS idx_alertes_echeance ON alertes(date_echeance) WHERE statut = 'active';

COMMENT ON TABLE alertes IS 'Système d''alertes pour maintenance, garanties, renouvellements';
COMMENT ON COLUMN alertes.type IS 'Type d''alerte: maintenance préventive, fin de garantie, renouvellement licence, etc.';
COMMENT ON COLUMN alertes.priorite IS 'Niveau de priorité de l''alerte';

-- ============================================
-- 3. Table LICENCES
-- ============================================

CREATE TABLE IF NOT EXISTS licences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  editeur TEXT,
  type_licence TEXT CHECK (type_licence IN ('Perpétuelle', 'Abonnement', 'Volume', 'OEM', 'Autre')),
  numero_licence TEXT,
  cle_produit TEXT,
  date_achat DATE,
  date_expiration DATE,
  cout NUMERIC(10, 2),
  nombre_postes INTEGER DEFAULT 1,
  postes_utilises INTEGER DEFAULT 0,
  materiel_id UUID REFERENCES materiels(id) ON DELETE SET NULL,
  contact_support TEXT,
  url_telechargement TEXT,
  notes TEXT,
  statut TEXT NOT NULL DEFAULT 'Active' CHECK (statut IN ('Active', 'Expirée', 'En attente', 'Résiliée')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_licences_statut ON licences(statut);
CREATE INDEX IF NOT EXISTS idx_licences_expiration ON licences(date_expiration);
CREATE INDEX IF NOT EXISTS idx_licences_materiel ON licences(materiel_id);

COMMENT ON TABLE licences IS 'Gestion des licences logicielles avec alertes de renouvellement';
COMMENT ON COLUMN licences.nombre_postes IS 'Nombre de postes autorisés par la licence';
COMMENT ON COLUMN licences.postes_utilises IS 'Nombre de postes actuellement utilisés';

-- Ajouter la FK licence_id dans alertes maintenant que licences existe
ALTER TABLE alertes ADD CONSTRAINT fk_alertes_licence 
  FOREIGN KEY (licence_id) REFERENCES licences(id) ON DELETE CASCADE;

-- ============================================
-- 4. Table REPARATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS reparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materiel_id UUID NOT NULL REFERENCES materiels(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL,
  date_fin DATE,
  type_intervention TEXT NOT NULL CHECK (type_intervention IN ('Maintenance préventive', 'Réparation', 'Mise à niveau', 'Diagnostic', 'Autre')),
  description TEXT NOT NULL,
  cout NUMERIC(10, 2),
  prestataire TEXT,
  numero_ticket TEXT,
  statut TEXT NOT NULL DEFAULT 'En cours' CHECK (statut IN ('En attente', 'En cours', 'Terminée', 'Annulée')),
  priorite TEXT DEFAULT 'Normale' CHECK (priorite IN ('Basse', 'Normale', 'Haute', 'Urgente')),
  pieces_changees TEXT,
  diagnostique TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reparations_materiel ON reparations(materiel_id);
CREATE INDEX IF NOT EXISTS idx_reparations_statut ON reparations(statut);
CREATE INDEX IF NOT EXISTS idx_reparations_date ON reparations(date_debut DESC);

COMMENT ON TABLE reparations IS 'Suivi des réparations et interventions sur le matériel';
COMMENT ON COLUMN reparations.type_intervention IS 'Type d''intervention effectuée';
COMMENT ON COLUMN reparations.pieces_changees IS 'Liste des pièces remplacées ou ajoutées';

-- ============================================
-- 5. Table CATEGORIES_IMAGES (config catégories)
-- ============================================

CREATE TABLE IF NOT EXISTS categories_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie TEXT UNIQUE NOT NULL,
  image_url TEXT,
  icone TEXT,
  couleur TEXT DEFAULT '#6366f1',
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_ordre ON categories_images(ordre);

COMMENT ON TABLE categories_images IS 'Configuration des images et styles pour chaque catégorie de matériel';

-- Insérer quelques catégories par défaut
INSERT INTO categories_images (categorie, icone, couleur, ordre) VALUES
  ('Ordinateur', 'Monitor', '#3b82f6', 1),
  ('Ordinateur portable', 'Laptop', '#8b5cf6', 2),
  ('Téléphone', 'Smartphone', '#10b981', 3),
  ('Tablette', 'Tablet', '#f59e0b', 4),
  ('Imprimante', 'Printer', '#ef4444', 5),
  ('Écran', 'Monitor', '#06b6d4', 6),
  ('Serveur', 'Server', '#6366f1', 7),
  ('Accessoire', 'Cable', '#84cc16', 8)
ON CONFLICT (categorie) DO NOTHING;

-- ============================================
-- 6. Vue pour alertes actives avec détails
-- ============================================

CREATE OR REPLACE VIEW v_alertes_actives AS
SELECT 
  a.id,
  a.type,
  a.titre,
  a.description,
  a.priorite,
  a.date_echeance,
  a.created_at,
  m.code_materiel,
  m.type AS materiel_type,
  l.nom AS licence_nom,
  CASE 
    WHEN a.date_echeance < CURRENT_DATE THEN 'Échue'
    WHEN a.date_echeance <= CURRENT_DATE + INTERVAL '7 days' THEN 'Urgente'
    WHEN a.date_echeance <= CURRENT_DATE + INTERVAL '30 days' THEN 'Prochaine'
    ELSE 'Planifiée'
  END AS urgence
FROM alertes a
LEFT JOIN materiels m ON a.materiel_id = m.id
LEFT JOIN licences l ON a.licence_id = l.id
WHERE a.statut = 'active'
ORDER BY 
  CASE a.priorite
    WHEN 'critique' THEN 1
    WHEN 'haute' THEN 2
    WHEN 'normale' THEN 3
    WHEN 'basse' THEN 4
  END,
  a.date_echeance ASC NULLS LAST;

-- ============================================
-- 7. Vue pour suivi réparations avec matériel
-- ============================================

CREATE OR REPLACE VIEW v_reparations_details AS
SELECT 
  r.id,
  r.date_debut,
  r.date_fin,
  r.type_intervention,
  r.description,
  r.cout,
  r.prestataire,
  r.statut,
  r.priorite,
  m.code_materiel,
  m.type AS materiel_type,
  m.marque,
  m.modele,
  CASE 
    WHEN r.date_fin IS NOT NULL 
    THEN r.date_fin - r.date_debut 
    ELSE CURRENT_DATE - r.date_debut 
  END AS duree_jours
FROM reparations r
INNER JOIN materiels m ON r.materiel_id = m.id
ORDER BY r.date_debut DESC;

-- ============================================
-- 8. Fonctions trigger pour updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers
DROP TRIGGER IF EXISTS update_alertes_updated_at ON alertes;
CREATE TRIGGER update_alertes_updated_at BEFORE UPDATE ON alertes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_licences_updated_at ON licences;
CREATE TRIGGER update_licences_updated_at BEFORE UPDATE ON licences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reparations_updated_at ON reparations;
CREATE TRIGGER update_reparations_updated_at BEFORE UPDATE ON reparations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Fonction pour créer alertes automatiques
-- ============================================

-- Alerte automatique quand une licence expire dans 30 jours
CREATE OR REPLACE FUNCTION check_licence_expiration()
RETURNS void AS $$
BEGIN
  INSERT INTO alertes (type, titre, description, priorite, date_echeance, licence_id)
  SELECT 
    'renouvellement',
    'Renouvellement licence: ' || l.nom,
    'La licence ' || l.nom || ' expire le ' || l.date_expiration::TEXT,
    CASE 
      WHEN l.date_expiration <= CURRENT_DATE + INTERVAL '7 days' THEN 'critique'
      WHEN l.date_expiration <= CURRENT_DATE + INTERVAL '15 days' THEN 'haute'
      ELSE 'normale'
    END,
    l.date_expiration,
    l.id
  FROM licences l
  WHERE l.statut = 'Active'
    AND l.date_expiration IS NOT NULL
    AND l.date_expiration BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM alertes a 
      WHERE a.licence_id = l.id 
        AND a.type = 'renouvellement' 
        AND a.statut = 'active'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_licence_expiration IS 'Créer automatiquement des alertes pour les licences expirant dans les 30 prochains jours';
