-- Forward migration: indexed PostGIS proximity search for active, available providers.
-- The generated geography is derived from longitude/latitude, so it cannot drift.
CREATE EXTENSION IF NOT EXISTS postgis;

-- Preflight before creating geography: invalid legacy values abort this migration
-- before any schema change is committed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "prestataires"
    WHERE "latitude" NOT BETWEEN -90 AND 90
       OR "longitude" NOT BETWEEN -180 AND 180
  ) THEN
    RAISE EXCEPTION 'Invalid provider coordinates: correct latitude/longitude before applying PostGIS migration';
  END IF;
END $$;

ALTER TABLE "prestataires"
  ADD CONSTRAINT "prestataires_latitude_plage" CHECK ("latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "prestataires_longitude_plage" CHECK ("longitude" BETWEEN -180 AND 180);

ALTER TABLE "prestataires"
  ADD COLUMN "position_geographique" geography(Point, 4326)
    GENERATED ALWAYS AS (
      ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
    ) STORED;

-- This partial GIST index supports ST_DWithin and KNN ordering (<->).
CREATE INDEX "prestataires_position_active_disponible_gist"
  ON "prestataires" USING GIST ("position_geographique")
  WHERE "statut_fiche" = 'active' AND "statut_disponibilite" = 'disponible';

CREATE INDEX "prestataire_categories_categorie_prestataire_idx"
  ON "prestataire_categories" ("categorie_id", "prestataire_id");

-- Rollback (manual; run only after rolling back the application release):
-- DROP INDEX IF EXISTS "prestataire_categories_categorie_prestataire_idx";
-- DROP INDEX IF EXISTS "prestataires_position_active_disponible_gist";
-- ALTER TABLE "prestataires" DROP COLUMN IF EXISTS "position_geographique";
-- ALTER TABLE "prestataires" DROP CONSTRAINT IF EXISTS "prestataires_latitude_plage";
-- ALTER TABLE "prestataires" DROP CONSTRAINT IF EXISTS "prestataires_longitude_plage";
-- DROP EXTENSION IF EXISTS postgis; -- succeeds only if no other object depends on it.
