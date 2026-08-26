import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rayon de la Terre en mètres
const RAYON_TERRE_M = 6371000;

function calculerDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RAYON_TERRE_M * c;
}

export async function listerPrestatairesParProximite(
  latitudeClient: number,
  longitudeClient: number,
  categorieId?: string
) {
  const prestataires = await prisma.prestataire.findMany({
    where: {
      statutFiche: 'active',
      ...(categorieId && {
        categories: { some: { categorieId } },
      }),
    },
    include: { categories: { include: { categorie: true } } },
  });

  return prestataires
    .map((p) => ({
      ...p,
      distanceM: Math.round(
        calculerDistanceM(latitudeClient, longitudeClient, p.latitude, p.longitude)
      ),
    }))
    .sort((a, b) => a.distanceM - b.distanceM);
}