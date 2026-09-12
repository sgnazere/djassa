## Rapport Phase 1 — Sécurité

**Date/heure** : 2026-09-12  
**Agent** : SECURITY  
**Statut** : ✅ Terminé (intégration mobile à réaliser en phase fonctionnelle)

### Réalisé

- Ajout de JWT **RS256** : access token de 15 minutes et refresh token de 7 jours, avec `iss`, `aud`, `sub`, `jti` et rôle.
- Rotation obligatoire du refresh token sur `POST /api/auth/rafraichir`. Seule son empreinte SHA-256 est stockée ; le jeton brut n'est jamais persisté.
- Ajout du rôle `admin` et de la migration `20260912000000_auth_rbac_refresh_tokens` (avec instructions de rollback commentées).
- Protection par Bearer JWT et RBAC de toutes les routes métier :
  - catégories et proximité : utilisateur authentifié ;
  - création de demande : rôle `client`, sans accepter de `clientId` venant du client ;
  - notifications/réponses : rôle `prestataire` propriétaire de la fiche/tentative, ou `admin`.
- Validation Zod stricte des corps et paramètres modifiés ; les requêtes contenant des champs inconnus sont rejetées.
- Validation de configuration au démarrage par Zod : `DATABASE_URL`, clés RSA, Twilio, issuer/audience et port. Aucun secret par défaut ou codé en dur.
- Helmet, suppression de `X-Powered-By`, CORS explicite incluant `Authorization`, taille JSON limitée et rate limiting global (100/15 min/IP) + auth (10/min/IP, 5 SMS/h/téléphone).
- Les erreurs et journaux continuent de masquer les secrets ; aucun token n'est journalisé.

### Fichiers créés/modifiés

- `src/config/environnement.ts`, `src/middlewares/authentification.ts`, `src/middlewares/validation-schema.ts`, `src/types/express.d.ts`
- `src/services/auth.service.ts`, routes `auth`, `demande`, `notification-prestataire`, `reponse-tentative`, `categorie`, `prestataire`, `src/index.ts`
- `prisma/schema.prisma`, `prisma/migrations/20260912000000_auth_rbac_refresh_tokens/migration.sql`
- `package.json`, `package-lock.json` (Helmet, express-rate-limit, JOSE, Zod)

### Tests

- `npm exec tsc -- --noEmit` : ✅ succès.
- `npx prisma generate` : ✅ succès.
- Les tests HTTP avec DB/Twilio simulés ne sont pas encore présents ; la phase tests doit couvrir l'expiration, la rotation, le refus RBAC et les rate limits.

### Risques résiduels

- Le mobile actuel n'envoie pas encore le Bearer token, ne stocke pas le refresh token et contient des IDs codés en dur : ses appels métier seront donc refusés jusqu'à son adaptation.
- Les rate limits en mémoire ne sont pas partagés entre instances ; Redis doit les remplacer en déploiement multi-instance.
- La révocation immédiate d'un access token reste bornée à sa durée maximale de 15 minutes. La suspension est contrôlée lors du refresh.
- CSRF double-submit n'est pas utilisé car l'API emploie uniquement le header Authorization Bearer, sans authentification par cookies.

### Prochaine étape recommandée

Intégrer la gestion AuthContext mobile (stockage sécurisé des tokens, header Bearer, refresh) avant d'activer les parcours métier protégés, puis ajouter les tests Supertest avec une base isolée.
