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

## Installation

```bash
cd webapp
npm install
cp .env.example .env
mysql -u root -p bleu_manager < database/schema.sql
npm run dev
```

L'administrateur initial n'est jamais stocké en clair dans Git. S'il n'existe encore aucun compte `ADMIN`, le premier appel de connexion crée le compte défini par `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_PASSWORD` et `BOOTSTRAP_ADMIN_NAME`.

Après la première connexion, remplacez/supprimez `BOOTSTRAP_ADMIN_PASSWORD` de l'environnement de production.

## Google Forms

Le fonctionnement historique peut être conservé : un trigger Apps Script `onFormSubmit` envoie les données à :

`POST /api/integrations/google-form`

Ajouter le header `x-google-forms-secret` avec la valeur de `GOOGLE_FORMS_WEBHOOK_SECRET`. Le endpoint accepte aussi un formulaire POST classique, ce qui facilite la migration du script existant.

## Migration des données historiques

La table `bleus` conserve volontairement les noms de colonnes historiques pour simplifier un premier import depuis `LISTING`. Elle ajoute un identifiant numérique stable, une origine (`source`) et des timestamps. Une migration ultérieure pourra normaliser les noms sans bloquer la reprise des données.
