-- Alignement catégories UI ↔ types inventaire (icônes Lucide côté app)

INSERT INTO public.categories_images (categorie, icone, couleur, ordre) VALUES
  ('Ordinateur Portable', 'Laptop', '#3b82f6', 1),
  ('Ordinateur Fixe', 'PcCase', '#6366f1', 2),
  ('Smartphone', 'Smartphone', '#10b981', 3),
  ('Moniteur', 'Monitor', '#06b6d4', 4),
  ('Tablet', 'Tablet', '#f59e0b', 5),
  ('Imprimante', 'Printer', '#ef4444', 6),
  ('Réseau', 'Router', '#0ea5e9', 7),
  ('Sécurité', 'Shield', '#64748b', 8),
  ('Batterie / Énergie', 'Battery', '#eab308', 9),
  ('Équipement AV / Studio', 'Video', '#a855f7', 10),
  ('Serveur', 'Server', '#6366f1', 11),
  ('Drone', 'Plane', '#14b8a6', 12),
  ('Stockage', 'HardDrive', '#78716c', 13),
  ('Poste VOIP', 'Phone', '#22c55e', 14),
  ('Accessoire', 'Cable', '#84cc16', 15)
ON CONFLICT (categorie) DO UPDATE
SET icone = EXCLUDED.icone,
    couleur = EXCLUDED.couleur,
    ordre = EXCLUDED.ordre;
