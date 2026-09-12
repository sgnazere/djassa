# Analyse initiale — Djassa

Date : 2026-09-12

## Périmètre observé

- `backend/` : Express 5 / TypeScript / Prisma 6 / PostgreSQL.
- `mobile/` : Expo 54 / React Native 0.81 / Expo Router.
- La migration Prisma initiale crée les modèles utilisateurs, prestataires,
  catégories, demandes, tentatives, avis, signalements et positions temps réel.

## Flux existant

L’application mobile récupère la position GPS avec `expo-location`, appelle
`GET /api/prestataires`, puis affiche les résultats sur une carte
`react-native-maps`. Le backend calcule actuellement les distances Haversine
en mémoire après avoir chargé les prestataires actifs.

Une demande peut être créée par `POST /api/demandes`. Le backend contacte un
prestataire à la fois et expire une tentative après 20 secondes. Ce mécanisme
utilise des timers et verrous en mémoire ; il n'est donc pas durable à un
redémarrage ni partagé entre instances.

L'authentification d'identité utilise Twilio Verify par SMS, mais la version
initiale ne produisait pas de jeton et les routes métier recevaient les IDs
depuis le corps des requêtes. Le mobile stocke l'utilisateur dans
AsyncStorage. Les rôles de données existants sont `client` et `prestataire`.

## Risques et écarts prioritaires

1. Absence d'authentification API et d'autorisation de propriété.
2. Timers et verrous de matching en mémoire.
3. Recherche de proximité non indexée et non exécutée dans PostgreSQL.
4. Parcours client mobile incomplet : pas de création/suivi/annulation de
   demande dans l'interface.
5. Écran prestataire utilisant un identifiant codé en dur et absence de push.
6. Modèles `Avis`, `Signalement` et `PositionTempsReel` sans API raccordée.
7. Absence de tests automatisés.

## Plan validé pour l'exécution

1. Sécuriser l'API : jetons, RBAC, validation et limitation de débit.
2. Rendre le traitement des demandes durable et la recherche géospatiale
   exécutable côté PostgreSQL.
3. Relier les parcours mobile, le temps réel et les notifications.
4. Ajouter une suite de tests et une intégration continue.

## Limites à confirmer par l'environnement

L'activation de PostGIS et Redis dépend des services disponibles dans
l'environnement de déploiement. Les migrations et la configuration seront
préparées dans le code, sans connexion à une base ni à un service externe.
