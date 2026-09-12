# djassa

Marketplace de services de proximité : un client publie une demande, les
prestataires proches sont notifiés en séquence jusqu'à ce que l'un accepte.

## Structure

- `backend/` — API Express 5 + TypeScript, Prisma 6 / PostgreSQL (Supabase), Twilio Verify (auth par SMS)
- `mobile/` — application Expo 54 / React Native 0.81 (expo-router, react-native-maps, expo-location)
- `ecrans-sauvegarde/` — sauvegardes d'écrans, non suivi par git

## Commandes

Backend (depuis `backend/`) :

- `npm run dev` — démarre l'API (`tsx src/index.ts`), port `PORT` ou 3000
- `npx tsc --noEmit` — vérification de types (aucun script dédié)
- `npx prisma migrate dev` — nouvelle migration
- `npx prisma studio` — inspection de la base

Mobile (depuis `mobile/`) :

- `npm start` — serveur Expo
- `npm run android` / `npm run ios`
- `npm run lint`

**Aucun test automatisé n'existe.** Le script `test` du backend est un stub qui
échoue volontairement (`exit 1`). Ne pas présenter une modification comme
« testée » tant qu'aucun test n'a été écrit.

## Conventions

- Le domaine est nommé en français (`Demande`, `Prestataire`, `Tentative`,
  `Signalement`, ...) — garder cette langue pour les modèles, les champs et
  les fonctions métier.
- Modèles Prisma en PascalCase, champs en camelCase avec `@map` vers du
  snake_case en base ; les tables sont mappées au pluriel français
  (`@@map("demandes")`).
- La logique métier vit dans `backend/src/services/`, les routes
  (`backend/src/routes/`) restent fines : elles valident et délèguent.
  Toutes les routes sont montées sous `/api`.
- `backend/` a son propre `.gitignore` (`.env`, `node_modules`, `/src/generated/prisma`).

## Règles de sécurité (non négociables)

- **Aucun secret en dur.** Les identifiants vivent dans `backend/.env`, jamais
  dans le code ni dans un commit. Vérifier `git status` avant chaque commit.
- **Toute route qui touche aux données d'un utilisateur doit vérifier que
  l'appelant est bien cet utilisateur.** Aujourd'hui l'API est ouverte :
  aucun middleware d'authentification n'est monté dans `src/index.ts`, et les
  `clientId` / `prestataireId` arrivent du corps de la requête. Ne pas ajouter
  une nouvelle route sur ce modèle — signaler l'absence d'autorisation plutôt
  que d'inventer un mécanisme au passage.
- **Valider toute entrée externe** (latitude, longitude, identifiants, textes
  libres) avant de la passer à Prisma.
- Ne jamais journaliser un token, un numéro de téléphone complet ou une chaîne
  de connexion.

## Points fragiles connus

- `demande.service.ts` s'appuie sur `setTimeout` pour expirer une tentative :
  la relance est perdue si le serveur redémarre, et deux réponses simultanées
  peuvent produire un état incohérent.
- `notifierProchainPrestataire` se rappelle elle-même depuis le timer — la
  chaîne de relance n'a pas de garde-fou de concurrence.
- Pas de CORS, pas de limiteur de débit, pas d'authentification sur l'API.
- `mobile/CLAUDE.md` renvoie à `mobile/AGENTS.md` : lire la documentation
  Expo v54 versionnée avant d'écrire du code mobile.