import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LIMITE_PAR_DEFAUT = 20;
const LIMITE_MAXIMALE = 20;
const RAYON_PAR_DEFAUT_M = 20_000;

export type OptionsRecherchePrestataires = {
  categorieId?: string;
  rayonM?: number;
  limite?: number;
  idsExclus?: string[];
};

/**
 * Recherche PostGIS indexee. Chaque interpolation Prisma est un parametre lie
 * PostgreSQL : aucune valeur externe n'est concatenee au SQL.
 */
export async function listerPrestatairesParProximite(
  latitudeClient: number,
  longitudeClient: number,
  options: OptionsRecherchePrestataires = {}
) {
  const rayonM = options.rayonM ?? RAYON_PAR_DEFAUT_M;
  const limite = Math.min(options.limite ?? LIMITE_PAR_DEFAUT, LIMITE_MAXIMALE);
  const idsExclus = options.idsExclus ?? [];

  return prisma.$queryRaw<PrestataireProche[]>(Prisma.sql`
    WITH point_client AS (
      SELECT ST_SetSRID(ST_MakePoint(${longitudeClient}, ${latitudeClient}), 4326)::geography AS position
    )
    SELECT
      p.id,
      p.utilisateur_id AS "utilisateurId",
      p.nom_commercial AS "nomCommercial",
      p.description,
      p.latitude,
      p.longitude,
      p.adresse_texte AS "adresseTexte",
      p.type_deplacement AS "typeDeplacement",
      p.mode_actuel AS "modeActuel",
      p.statut_disponibilite AS "statutDisponibilite",
      p.piece_justificative_type AS "pieceJustificativeType",
      p.piece_justificative_url AS "pieceJustificativeUrl",
      p.verification_ia_statut AS "verificationIaStatut",
      p.visite_terrain_faite AS "visiteTerrainFaite",
      p.visite_terrain_date AS "visiteTerrainDate",
      p.statut_fiche AS "statutFiche",
      p.note_moyenne AS "noteMoyenne",
      p.date_creation AS "dateCreation",
      ROUND(ST_Distance(p.position_geographique, point_client.position))::integer AS "distanceM"
    FROM prestataires AS p
    CROSS JOIN point_client
    WHERE p.statut_fiche = 'active'::"StatutFiche"
      AND p.statut_disponibilite = 'disponible'::"StatutDisponibilite"
      AND ST_DWithin(p.position_geographique, point_client.position, ${rayonM})
      AND (
        ${options.categorieId ?? null}::text IS NULL
        OR EXISTS (
          SELECT 1 FROM prestataire_categories AS pc
          WHERE pc.prestataire_id = p.id
            AND pc.categorie_id = ${options.categorieId ?? null}::text
        )
      )
      AND (cardinality(${idsExclus}::text[]) = 0 OR NOT (p.id = ANY(${idsExclus}::text[])))
    ORDER BY p.position_geographique <-> point_client.position
    LIMIT ${limite}
  `);
}

/** Champs renvoyes par la requete SQL, avec l'alias distanceM. */
type PrestataireProche = { id: string; statutDisponibilite: 'disponible'; distanceM: number };
