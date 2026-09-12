## Rapport Phase 2 - Geospatial

**Date/heure** : 2026-09-12
**Agent** : GEOSPATIAL
**Status** : Termine (migration non executee sur une base externe)

### Realise

- Ajout de la migration [20260912010000_postgis_prestataires/migration.sql](prisma/migrations/20260912010000_postgis_prestataires/migration.sql) : extension PostGIS, controles des coordonnees, colonne `geography(Point,4326)` calculee depuis longitude/latitude, index GIST partiel pour les prestataires actifs et disponibles, et index inverse de categorie.
- La migration refuse les coordonnees historiques invalides avant tout changement. Elle est transactionnelle sous PostgreSQL ; la base reste intacte si ce controle echoue.
- La strategie de rollback manuel est documentee a la fin de la migration. L'extension PostGIS n'est retiree qu'en dernier et seulement si aucun autre objet ne l'utilise.
- Remplacement du filtrage Haversine en memoire par une requete Prisma parametree dans `src/services/prestataire.service.ts`. Elle utilise `ST_DWithin`, `ST_Distance` et l'ordre KNN GIST (`<->`), avec categorie facultative, disponibilite, fiche active, rayon, limite et exclusions.
- `GET /api/prestataires` accepte maintenant `rayonM` (1 a 100000, metres) et `limite` (1 a 20). Les valeurs sont validees avant la requete.
- Le matching de demandes fournit son rayon courant et exclut les prestataires deja notifies directement dans la recherche SQL.

### Tests

- `npm exec tsc -- --noEmit` dans `backend` : OK.
- `npm exec prisma validate` n'a pas pu demarrer : le binaire Prisma absent devait etre telecharge et la connexion reseau du sandbox a ete refusee. Aucune alternative locale n'a execute la migration.
- Aucune migration ni requete PostGIS n'a ete executee : une instance PostgreSQL/PostGIS configuree par `DATABASE_URL` est necessaire pour un test d'integration.

### Risques residuels

- La colonne `position_geographique` est une colonne SQL geree par migration et n'est pas exposee dans le schema Prisma, car Prisma ne type pas nativement `geography`. Ne pas la selectionner avec `p.*` dans une requete Prisma brute : le type PostGIS n'est pas deserialisable par Prisma. La requete actuelle selectionne explicitement des colonnes compatibles.
- La recherche est plafonnee a 20 resultats par conception. Pour des recherches de matching a rayon tres large, ce plafond est intentionnel et favorise les candidats les plus proches ; le mecanisme d'exclusion permet de progresser lors des relances.

### Prochaine etape recommandee

- Appliquer la migration dans un environnement PostgreSQL ou Supabase ou PostGIS est disponible, puis executer `EXPLAIN (ANALYZE, BUFFERS)` sur une recherche representative afin de verifier l'utilisation de `prestataires_position_active_disponible_gist`.
