# Runbook INFINITY ITAM

## Déploiement

1. Pousser `master` vers GitHub (Vercel déploie automatiquement).
2. Vérifier les variables d'environnement Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **requis pour gérer les utilisateurs depuis le web** : `SUPABASE_SERVICE_ROLE_KEY`
   - optionnel : `CRON_SECRET`, `RESEND_API_KEY`, `ALERTES_EMAIL_TO`
3. Appliquer les migrations SQL dans l'éditeur Supabase, dans l'ordre des fichiers `supabase/migrations/`.

## Migrations critiques

- `20260805_01` à `20260805_04` : RLS, transactions d'attribution, contraintes.
- `20260812_05` : rôles, journal d'audit, prêts, pièces jointes, bucket Storage `itam-fichiers`.
- `20260812_06` : policies RLS lecture/écriture sur `comptes_systeme` / `comptes_roles`.

- `20260819_07` : module ITSM (tickets, commentaires, faits marquants, demandeurs).

Sans `20260812_05`, l'app reste utilisable : audit, prêts et pièces jointes se dégradent silencieusement.
Sans `20260819_07`, la section **ITSM — Tickets** (`/itsm`) est indisponible.

## ITSM (Support IT)

Page **ITSM — Tickets** (`/itsm`) :
- création manuelle + détail ticket (commentaires, pièces jointes, timeline audit)
- import CSV ManageEngine (dédup par Request ID)
- modèle onboarding (7 tickets)
- faits marquants du jour
- SLA : saisie manuelle = retard auto après **30 jours** ; import CSV = colonne `Is Overdue`

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
