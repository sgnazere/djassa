-- CreateEnum
CREATE TYPE "TypeCompte" AS ENUM ('client', 'prestataire');

-- CreateEnum
CREATE TYPE "StatutUtilisateur" AS ENUM ('actif', 'suspendu');

-- CreateEnum
CREATE TYPE "TypeService" AS ENUM ('fixe', 'mobile');

-- CreateEnum
CREATE TYPE "TypeDeplacement" AS ENUM ('fixe', 'mobile', 'mixte');

-- CreateEnum
CREATE TYPE "ModeActuel" AS ENUM ('au_local', 'en_deplacement');

-- CreateEnum
CREATE TYPE "StatutDisponibilite" AS ENUM ('disponible', 'en_intervention', 'hors_ligne');

-- CreateEnum
CREATE TYPE "PieceJustificativeType" AS ENUM ('CNI', 'carte_pro');

-- CreateEnum
CREATE TYPE "VerificationIaStatut" AS ENUM ('en_attente', 'valide', 'suspect', 'rejete');

-- CreateEnum
CREATE TYPE "StatutFiche" AS ENUM ('en_attente_validation', 'active', 'suspendue');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('en_recherche', 'acceptee', 'annulee', 'terminee');

-- CreateEnum
CREATE TYPE "StatutTentative" AS ENUM ('notifie', 'accepte', 'decline', 'expire');

-- CreateEnum
CREATE TYPE "CibleType" AS ENUM ('prestataire', 'avis');

-- CreateEnum
CREATE TYPE "StatutSignalement" AS ENUM ('en_attente', 'traite', 'rejete');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "type_compte" "TypeCompte" NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutUtilisateur" NOT NULL DEFAULT 'actif',

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type_service" "TypeService" NOT NULL,
    "icone" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestataires" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "nom_commercial" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "adresse_texte" TEXT,
    "type_deplacement" "TypeDeplacement" NOT NULL,
    "mode_actuel" "ModeActuel",
    "statut_disponibilite" "StatutDisponibilite",
    "piece_justificative_type" "PieceJustificativeType" NOT NULL,
    "piece_justificative_url" TEXT NOT NULL,
    "verification_ia_statut" "VerificationIaStatut" NOT NULL DEFAULT 'en_attente',
    "visite_terrain_faite" BOOLEAN NOT NULL DEFAULT false,
    "visite_terrain_date" TIMESTAMP(3),
    "statut_fiche" "StatutFiche" NOT NULL DEFAULT 'en_attente_validation',
    "note_moyenne" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestataires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestataire_categories" (
    "prestataire_id" TEXT NOT NULL,
    "categorie_id" TEXT NOT NULL,

    CONSTRAINT "prestataire_categories_pkey" PRIMARY KEY ("prestataire_id","categorie_id")
);

-- CreateTable
CREATE TABLE "avis" (
    "id" TEXT NOT NULL,
    "prestataire_id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "categorie_id" TEXT NOT NULL,
    "latitude_client" DOUBLE PRECISION NOT NULL,
    "longitude_client" DOUBLE PRECISION NOT NULL,
    "prestataire_retenu_id" TEXT,
    "statut" "StatutDemande" NOT NULL DEFAULT 'en_recherche',
    "rayon_diffusion_actuel_m" INTEGER NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_acceptation" TIMESTAMP(3),

    CONSTRAINT "demandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demande_tentatives" (
    "id" TEXT NOT NULL,
    "demande_id" TEXT NOT NULL,
    "prestataire_id" TEXT NOT NULL,
    "ordre_tentative" INTEGER NOT NULL,
    "distance_m" INTEGER NOT NULL,
    "statut" "StatutTentative" NOT NULL DEFAULT 'notifie',
    "date_notification" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_reponse" TIMESTAMP(3),

    CONSTRAINT "demande_tentatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signalements" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "cible_type" "CibleType" NOT NULL,
    "cible_id" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "statut" "StatutSignalement" NOT NULL DEFAULT 'en_attente',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signalements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions_temps_reel" (
    "demande_id" TEXT NOT NULL,
    "prestataire_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "derniere_maj" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "positions_temps_reel_pkey" PRIMARY KEY ("demande_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_telephone_key" ON "utilisateurs"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "prestataires_utilisateur_id_key" ON "prestataires"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "positions_temps_reel_prestataire_id_key" ON "positions_temps_reel"("prestataire_id");

-- AddForeignKey
ALTER TABLE "prestataires" ADD CONSTRAINT "prestataires_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestataire_categories" ADD CONSTRAINT "prestataire_categories_prestataire_id_fkey" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestataire_categories" ADD CONSTRAINT "prestataire_categories_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_prestataire_id_fkey" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes" ADD CONSTRAINT "demandes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes" ADD CONSTRAINT "demandes_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes" ADD CONSTRAINT "demandes_prestataire_retenu_id_fkey" FOREIGN KEY ("prestataire_retenu_id") REFERENCES "prestataires"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demande_tentatives" ADD CONSTRAINT "demande_tentatives_demande_id_fkey" FOREIGN KEY ("demande_id") REFERENCES "demandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demande_tentatives" ADD CONSTRAINT "demande_tentatives_prestataire_id_fkey" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signalements" ADD CONSTRAINT "signalements_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions_temps_reel" ADD CONSTRAINT "positions_temps_reel_demande_id_fkey" FOREIGN KEY ("demande_id") REFERENCES "demandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions_temps_reel" ADD CONSTRAINT "positions_temps_reel_prestataire_id_fkey" FOREIGN KEY ("prestataire_id") REFERENCES "prestataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
