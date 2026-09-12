-- Forward migration: introduces the explicit administrator role and durable,
-- revocable refresh-token records. The token itself is never stored.
ALTER TYPE "TypeCompte" ADD VALUE IF NOT EXISTS 'admin';

CREATE TABLE "jetons_actualisation" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "empreinte" TEXT NOT NULL,
    "expire_le" TIMESTAMP(3) NOT NULL,
    "revoque_le" TIMESTAMP(3),
    "remplace_par_id" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jetons_actualisation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "jetons_actualisation_empreinte_key" ON "jetons_actualisation"("empreinte");
CREATE UNIQUE INDEX "jetons_actualisation_remplace_par_id_key" ON "jetons_actualisation"("remplace_par_id");
CREATE INDEX "jetons_actualisation_utilisateur_id_idx" ON "jetons_actualisation"("utilisateur_id");
ALTER TABLE "jetons_actualisation" ADD CONSTRAINT "jetons_actualisation_utilisateur_id_fkey"
  FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jetons_actualisation" ADD CONSTRAINT "jetons_actualisation_remplace_par_id_fkey"
  FOREIGN KEY ("remplace_par_id") REFERENCES "jetons_actualisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rollback (run manually only after all issued refresh tokens have expired):
-- ALTER TABLE "jetons_actualisation" DROP CONSTRAINT "jetons_actualisation_remplace_par_id_fkey";
-- ALTER TABLE "jetons_actualisation" DROP CONSTRAINT "jetons_actualisation_utilisateur_id_fkey";
-- DROP TABLE "jetons_actualisation";
-- PostgreSQL enum values cannot be safely removed in-place; retain 'admin' on rollback.
