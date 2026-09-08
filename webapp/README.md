# Bleu Manager v2 — Astro

Refonte web mobile-first basée sur la stack du site `carte-fede` : Astro + Tailwind, avec une couleur d'accent Rouge Croix-Rouge (`#E21224`). L'ancienne application Flutter et le serveur PHP restent présents à la racine du dépôt pendant la migration.

## Fonctionnalités déjà posées

- Webapp responsive : aucune application native à installer.
- Authentification par session HttpOnly.
- Deux rôles : `ADMIN` et `CHEF_FLICS`.
- L'administrateur peut créer des comptes Chef flics.
- Listing des bleus avec recherche mobile.
- Export complet des données en `.xlsx` via ExcelJS.
- Webhook Google Forms compatible avec les clés historiques (`nom`, `prenom`, `sexe`, `adresse`, `daten`, `regio`, `resplegal`, `numresplegal`, `tel`).
- Requêtes SQL paramétrées et mots de passe hashés avec bcrypt.

## Installation locale

```bash
cd webapp
npm install
cp .env.example .env
mysql -u root -p bleu_manager < database/schema.sql
npm run dev
```

L'administrateur initial n'est jamais stocké en clair dans Git. S'il n'existe encore aucun compte `ADMIN`, le premier appel de connexion crée le compte défini par `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_PASSWORD` et `BOOTSTRAP_ADMIN_NAME`.

Après la première connexion, remplacez/supprimez `BOOTSTRAP_ADMIN_PASSWORD` de l'environnement de production.

## Déploiement Vercel

Le dépôt contient également l'ancienne application Flutter : le projet Astro n'est donc pas situé à la racine Git.

Dans **Vercel > Project > Settings > Build and Deployment** :

- **Root Directory** : `webapp`
- **Framework Preset** : `Astro`
- **Build Command** : laisser la valeur par défaut (`npm run build`)
- **Install Command** : laisser la valeur par défaut (`npm install`)

Ajouter ensuite les variables de `.env.example` dans **Settings > Environment Variables**. Ne jamais ajouter un vrai fichier `.env` au dépôt.

La webapp utilise l'adaptateur officiel `@astrojs/vercel` en rendu serveur, car l'authentification, l'export Excel et les endpoints API nécessitent du SSR.

## Google Forms

Le fonctionnement historique peut être conservé : un trigger Apps Script `onFormSubmit` envoie les données à :

`POST /api/integrations/google-form`

Ajouter le header `x-google-forms-secret` avec la valeur de `GOOGLE_FORMS_WEBHOOK_SECRET`. Le endpoint accepte aussi un formulaire POST classique, ce qui facilite la migration du script existant.

## Migration des données historiques

La table `bleus` conserve volontairement les noms de colonnes historiques pour simplifier un premier import depuis `LISTING`. Elle ajoute un identifiant numérique stable, une origine (`source`) et des timestamps. Une migration ultérieure pourra normaliser les noms sans bloquer la reprise des données.
