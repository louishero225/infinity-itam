-- Ajouter colonne pour numéro d'attribution lisible
ALTER TABLE attributions ADD COLUMN IF NOT EXISTS numero_attribution TEXT;

-- Créer un index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_attributions_numero ON attributions(numero_attribution);

-- Fonction pour générer le prochain numéro d'attribution
CREATE OR REPLACE FUNCTION generate_numero_attribution()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INT;
  numero TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Trouver le dernier numéro de l'année en cours
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(numero_attribution FROM 'ATR-' || current_year || '-(\d+)')
        AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM attributions
  WHERE numero_attribution LIKE 'ATR-' || current_year || '-%';
  
  -- Formater avec padding (ex: ATR-2025-001)
  numero := 'ATR-' || current_year || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN numero;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_numero_attribution() IS 'Génère un numéro d''attribution au format ATR-YYYY-NNN';

-- Mettre à jour les attributions existantes avec des numéros
DO $$
DECLARE
  attr RECORD;
  current_year TEXT;
  counter INT := 1;
BEGIN
  FOR attr IN 
    SELECT id, date_attribution 
    FROM attributions 
    WHERE numero_attribution IS NULL 
    ORDER BY date_attribution
  LOOP
    current_year := EXTRACT(YEAR FROM attr.date_attribution)::TEXT;
    
    UPDATE attributions 
    SET numero_attribution = 'ATR-' || current_year || '-' || LPAD(counter::TEXT, 3, '0')
    WHERE id = attr.id;
    
    counter := counter + 1;
  END LOOP;
END $$;
