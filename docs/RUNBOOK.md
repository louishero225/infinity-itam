# Runbook INFINITY ITAM

## Déploiement

1. Pousser `master` vers GitHub (Vercel déploie automatiquement).
2. Vérifier les variables d'environnement Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **requis pour gérer les utilisateurs depuis le web** : `SUPABASE_SERVICE_ROLE_KEY`
   - optionnel : `CRON_SECRET`, `RESEND_API_KEY`, `ALERTES_EMAIL_TO`, `ALERTES_EMAIL_FROM`, `ITSM_NOTIFY_TO`, `NEXT_PUBLIC_SITE_URL`
3. Appliquer les migrations SQL dans l'éditeur Supabase, dans l'ordre des fichiers `supabase/migrations/`.

## Migrations critiques

- `20260805_01` à `20260805_04` : RLS, transactions d'attribution, contraintes.
- `20260812_05` : rôles, journal d'audit, prêts, pièces jointes, bucket Storage `itam-fichiers`.
- `20260812_06` : policies RLS lecture/écriture sur `comptes_systeme` / `comptes_roles`.

- `20260819_07` : module ITSM (tickets, commentaires, faits marquants, demandeurs).
- `20260821_10` : commentaires internes (`ticket_comments.is_internal`) + prérequis notifications e-mail.
- `20260824_11` : flotte téléphonique Orange (`numeros_flotte`, `demandes_flotte_orange`, historique attributions).
- `20260826_12` : forfaits mensuels flotte (`formule`, `montant_ht`, `montant_ttc` — MIX 3 = 2 500 TTC / MIX 5 = 5 000 TTC).
- `20260827_13` : catégorie inventaire Accessoire (préfixe app `IAG-ACC`, fiches individuelles Stock / Attribué).
- `20260828_14` : `materiels.sous_categorie` pour sous-types accessoires (Souris, Chargeur, Casque…).

### Accessoires (inventaire)
- Type matériel : **Accessoire** · codes auto : **`IAG-ACC-001`**, …
- Sous-catégories : Souris, Clavier, Chargeur, Casque, Hub / Dock, Câble, Sacoche, Webcam, Adaptateur, Autre (avec icônes).
- Statut **Stock** = disponible ; **Attribué** = lié à un collaborateur (module Attributions).
- Colonnes utiles pour une liste Excel à importer : `sous_categorie`, `marque`, `modele`, `numero_serie`, `statut`, `titulaire` éventuel.
- Le champ texte `attributions.accessoires` reste pour les notes de remise (non inventorié).

Sans `20260812_05`, l'app reste utilisable : audit, prêts et pièces jointes se dégradent silencieusement.
Sans `20260819_07`, la section **ITSM — Tickets** (`/itsm`) est indisponible.

## ITSM (Support IT)

Page **ITSM — Tickets** (`/itsm`) :
- création manuelle + détail ticket (commentaires publics / notes internes, pièces jointes, timeline audit)
- import CSV ManageEngine (dédup par Request ID)
- modèle onboarding (7 tickets)
- faits marquants du jour
- SLA par priorité : High **3 j** · Medium **7 j** · Normal **14 j** · Non défini **30 j**
- notifications Resend : réponse publique → demandeur ; changement de statut → demandeur ; nouvelle demande portail → `ITSM_NOTIFY_TO` (sinon `ALERTES_EMAIL_TO`)

Pour migrer depuis l'ancien projet HTML (`iag-support-it`), exporter les tables Supabase `tickets`, `faits_marquants`, `demandeurs` et les importer dans le Supabase ITAM après la migration 07.

Script automatique (ancien projet `mcdoybrdszdcczwzrexb`) :

```bash
npm run migrate:itsm          # simulation
npm run migrate:itsm:execute  # import réel
```

## Rôles (via le web)

1. Ouvrir **Administration → Utilisateurs**.
2. Cliquer **M’enregistrer comme admin** (première fois).
3. Créer d’autres comptes avec e-mail + mot de passe temporaire + rôles.

Table `roles` : `admin`, `itam`, `lecture`. Si aucun rôle n'est assigné, le compte a tous les droits (bootstrap).

## Incidents fréquents

**Attribution en double** : l'index unique `idx_attributions_one_active_per_materiel` bloque. Restituer d'abord.

**RPC absente** : l'app bascule en écriture directe. Appliquer `20260805_02`.

**Fiche onboarding vide** : ouvrir la fiche employé → « Fiche onboarding ».

**Import Excel cassé** : Administration → dry-run avant exécution. Fusionner les doublons employés ensuite.

**Cron e-mails 401** : envoyer `Authorization: Bearer $CRON_SECRET`.
