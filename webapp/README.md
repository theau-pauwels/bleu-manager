# Bleu Manager v2 — Astro

Refonte web mobile-first basée sur la stack du site `carte-fede` : Astro + Tailwind, avec une couleur d'accent Rouge Croix-Rouge (`#E21224`). L'ancienne application Flutter et le serveur PHP restent présents à la racine du dépôt pendant la migration.

## Stockage de test : Vercel Private Blob

La version de test n'a plus besoin de MySQL/MariaDB. Les utilisateurs, sessions et bleus sont stockés dans un objet JSON privé Vercel Blob (`bleu-manager/test-db.json` par défaut).

Ce choix est volontairement temporaire : il simplifie les tests et le déploiement, mais un fichier JSON objet n'offre pas les garanties transactionnelles d'une vraie base SQL. Ne pas l'utiliser comme stockage de production avec des données réelles/sensibles ou de nombreuses écritures concurrentes.

### Configuration Vercel

1. Ouvrir le projet Vercel puis **Storage**.
2. Créer un **Blob Store** avec l'accès **Private**.
3. Connecter ce store au projet Bleu Manager.
4. Ajouter les variables de `.env.example` dans **Settings > Environment Variables**.
5. Redéployer le dernier commit.

Les nouveaux Blob Stores connectés utilisent l'authentification OIDC de Vercel. Il n'est donc normalement pas nécessaire de créer manuellement un `BLOB_READ_WRITE_TOKEN` en production Vercel.

## Fonctionnalités déjà posées

- Webapp responsive : aucune application native à installer.
- Authentification par session HttpOnly.
- Deux rôles : `ADMIN` et `CHEF_FLICS`.
- L'administrateur peut créer des comptes Chef flics.
- Listing des bleus avec recherche mobile.
- Export complet des données en `.xlsx` via ExcelJS.
- Webhook Google Forms compatible avec les clés historiques (`nom`, `prenom`, `sexe`, `adresse`, `daten`, `regio`, `resplegal`, `numresplegal`, `tel`).
- Mots de passe hashés avec bcrypt.

## Installation locale

```bash
cd webapp
npm install
cp .env.example .env
vercel link
vercel env pull
npm run dev
```

L'administrateur initial n'est jamais stocké en clair dans Git. S'il n'existe encore aucun compte `ADMIN`, le premier appel de connexion crée le compte défini par `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_PASSWORD` et `BOOTSTRAP_ADMIN_NAME`.

## Déploiement Vercel

Dans **Vercel > Project > Settings > Build and Deployment** :

- **Root Directory** : `webapp`
- **Framework Preset** : `Astro`
- **Build Command** : `npm run build`
- **Install Command** : `npm install`

La webapp utilise l'adaptateur officiel `@astrojs/vercel` en rendu serveur, car l'authentification, l'export Excel et les endpoints API nécessitent du SSR.

## Google Forms

Le fonctionnement historique est conservé : un trigger Apps Script `onFormSubmit` peut envoyer les données à `POST /api/integrations/google-form` avec le header `x-google-forms-secret` contenant `GOOGLE_FORMS_WEBHOOK_SECRET`.

## Migration future vers SQL

La couche de stockage Blob est isolée dans `src/lib/blob-db.ts`. Quand la phase de test sera terminée, elle pourra être remplacée par une base PostgreSQL/MySQL sans modifier l'interface utilisateur ni le format de l'export Excel.
