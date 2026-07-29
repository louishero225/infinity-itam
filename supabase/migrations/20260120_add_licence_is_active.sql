-- Migration: Ajouter colonne is_active à la table licences
-- Description: Permet de gérer l'état actif/inactif des licences
-- Date: 2026-01-20

-- Ajouter la colonne is_active avec valeur par défaut true
ALTER TABLE licences 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Créer un index pour optimiser les requêtes filtrées par is_active
CREATE INDEX IF NOT EXISTS idx_licences_is_active ON licences(is_active);

-- Créer un index composite pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_licences_is_active_statut ON licences(is_active, statut);

-- Commentaire sur la colonne
COMMENT ON COLUMN licences.is_active IS 'Indique si la licence est active (true) ou désactivée (false). Par défaut, toutes les licences sont actives.';
