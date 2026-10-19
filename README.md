# NickShop Content Studio

Studio marketing en français pour les parfums et produits de beauté NickShop au Cameroun. Interface React 19 / TypeScript / Tailwind CSS 4, serveur Node.js et intégration Gemini facultative. Remplace entièrement l’ancien site Farelle.

## Démarrer

Node.js 24 et npm sont utilisés dans cet environnement.

```sh
cd /workspace/K
npm ci --cache /workspace/.npm-cache
npm run dev
```

Le serveur écoute sur le port 5173, interface locale par défaut. `HOST` et `PORT` permettent d’adapter l’écoute à votre hébergement. Pour une version compilée :

```sh
npm run build
npm start
```

## Fonctionnalités du MVP

- Tableau de bord calculé à partir des contenus réels, hors démonstration ; résultats commerciaux manuels, coût par conversation, CPA, ROAS et marge contributive.
- Catalogue : création, modification, suppression, photo (JPG/PNG/WebP ≤ 3 Mo), prix FCFA, description et caractéristiques vérifiées, stock et activation. Les produits indisponibles sont exclus des sélections et plannings automatiques.
- Rédaction : trois versions Facebook, TikTok et WhatsApp ; édition, copie, variantes, ton, sauvegarde du brief et bibliothèque. Le mode local emploie des modèles éditoriaux clairement identifiés ; Gemini génère de vrais textes si connecté.
- Concepts visuels : trois directions, composition, palette, typographie, texte, format, prompt, justification, régénération locale et export du brief. Les aperçus sont des illustrations CSS, jamais présentées comme des images générées. Une photo de référence n’est pas envoyée ni analysée par Gemini ; le prompt demande sa préservation à l’outil d’image utilisé ensuite.
- Calendrier : génération de planning 7/15/30 jours à partir de modèles locaux, rythme hebdomadaire, produits, plateformes, objectifs, offres confirmées et budget ; vues mensuelle, hebdomadaire et liste ; édition, duplication, suppression, glisser-déposer et ouverture dans les studios.
- Export CSV UTF-8, ICS (heures Cameroun converties en UTC), impression PDF par le navigateur. Les exports respectent la période et la plateforme affichées.
- Sauvegarde locale, export/import JSON validé avec confirmation de remplacement, retrait de la démonstration. Les fichiers image sont stockés localement sous forme de données encodées.

Les statuts « Programmé » et « Publié » sont renseignés manuellement. Aucune intégration Meta, TikTok, WhatsApp ou génération d’image n’est simulée.

## Connecter Gemini

Copier `.env.example` vers `.env`, renseigner `GEMINI_API_KEY` **uniquement côté serveur**, puis redémarrer. Modèle par défaut : `gemini-2.5-flash` ; modifiable via `GEMINI_MODEL`. L’endpoint requis est `generativelanguage.googleapis.com`.

Le serveur appelle Gemini avec la clé dans l’en-tête, valide les réponses JSON, limite la taille des requêtes et la fréquence de génération, refuse les origines tierces et gère les erreurs/quota. La clé n’est jamais envoyée au frontend. `/api/status` n’expose que l’état de connexion. Un appel IA échoué affiche une erreur ; il n’est pas présenté comme une génération réussie.

Sans clé, le mode local fonctionne immédiatement. L’objectif et le ton servent surtout à la génération Gemini ; les modèles locaux sont volontairement simples et nécessitent une relecture humaine. Les affirmations fournies par l’utilisateur doivent être vérifiées avant publication.

## Stockage et authentification

Le MVP actuel stocke les données dans **localStorage**, sur un navigateur et une origine. Il ne propose pas encore de compte utilisateur, de sauvegarde cloud ni de synchronisation entre appareils. Exporter régulièrement une sauvegarde depuis Paramètres. Une image trop volumineuse pour le stockage déclenche un avertissement de sauvegarde.

`supabase/schema.sql` prépare les tables produits, publications, calendriers, concepts, médias, paramètres, bibliothèque et résultats. Il inclut des règles RLS par utilisateur et un bucket privé avec politiques de dossiers. Ce schéma n’a pas été exécuté ni testé sur un projet Supabase réel.

Pour la prochaine phase cloud : créer un projet Supabase, appliquer et vérifier la migration, ajouter le client Supabase Auth, les parcours de connexion/récupération, remplacer la couche `src/store.ts` par un adaptateur authentifié et migrer les photos vers Storage avec URLs signées. Ne jamais mettre la clé service role dans le navigateur. L’API Gemini devra vérifier le JWT utilisateur avant toute exposition publique ; le contrôle d’origine et la limitation de fréquence actuels ne remplacent pas l’authentification. Le serveur reste lié à l’interface locale par défaut.

## Déploiement

Le workflow GitHub Actions construit `dist` et déploie uniquement le frontend sur GitHub Pages. Sur cet hébergement statique, les fonctionnalités locales restent disponibles, mais aucune API Gemini n’est hébergée : le frontend utilise les modèles locaux si la route API est absente. Ne publiez jamais une clé dans le build Vite. Le déploiement Pages dépend de l’activation de GitHub Pages avec GitHub Actions dans les paramètres du dépôt.

Pour utiliser Gemini, héberger le serveur Node derrière HTTPS, configurer `APP_ORIGIN`, ajouter une authentification à l’API et définir le secret côté hébergeur. Les intégrations sociales officielles et la génération d’images sont des étapes ultérieures.

## Vérifications

```sh
npm test          # logique métier et exports
npm run build     # TypeScript et build Vite
npm run test:e2e  # parcours navigateur et API
```

Les tests E2E utilisent Chromium (`/usr/bin/chromium` dans l’environnement cloud). Ils couvrent la création d’un produit, sa persistance, la rédaction, l’enregistrement, la planification, l’export CSV, les concepts, l’exclusion des ruptures, l’interface mobile et la validation API. Les appels Gemini réels et les migrations Supabase nécessitent des accès externes et ne sont pas couverts par ces tests locaux.

## Structure

- `src/App.tsx` : navigation et persistance.
- `src/Dashboard.tsx`, `Products.tsx`, `Studio.tsx`, `Calendar.tsx`, `Library.tsx`, `Settings.tsx` : modules.
- `src/domain.mjs` : logique métier, rédaction locale, planning et exports.
- `src/services/generate.ts` : client de génération avec support de l’hébergement statique.
- `server.mjs` : serveur Vite/production et proxy Gemini.
- `supabase/schema.sql` : préparation de la future persistance cloud.

## Windows desktop application

The app also runs as a standalone Windows desktop application. See [DESKTOP.md](DESKTOP.md) for installation, offline behavior, encrypted Gemini configuration, web-to-desktop data transfer and build instructions. Run `npm run desktop` for the desktop version or `npm run desktop:windows` to build the x64 installer. End users do not need a web server or Node.js.
