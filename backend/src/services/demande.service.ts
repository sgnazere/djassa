import { PrismaClient } from '@prisma/client';
import { listerPrestatairesParProximite } from './prestataire.service';
import { planifierExpirationTentative, planifierProchainPrestataire } from './file-matching.service';

const prisma = new PrismaClient();
const RAYON_INITIAL_M = 2000;
const DELAI_REPONSE_MS = 20 * 1000;
const TENTATIVES_AVANT_ELARGISSEMENT = 3;

export async function creerDemande(clientId: string, categorieId: string, latitudeClient: number, longitudeClient: number) {
  const demande = await prisma.demande.create({
    data: { clientId, categorieId, latitudeClient, longitudeClient, statut: 'en_recherche', rayonDiffusionActuelM: RAYON_INITIAL_M },
  });
  await planifierProchainPrestataire(demande.id);
  return { demande, tentative: null };
}

// Compatibilite avec les routes existantes : l'action est desormais asynchrone.
export async function notifierProchainPrestataire(demandeId: string) {
  await planifierProchainPrestataire(demandeId);
  return null;
}

// Appelee uniquement par le worker BullMQ. Les controles d'etat rendent ce job
// idempotent : un doublon ne cree pas de seconde tentative ouverte.
export async function executerMatchingDemande(demandeId: string) {
  const demande = await prisma.demande.findUnique({ where: { id: demandeId } });
  if (!demande || demande.statut !== 'en_recherche') return null;
  const tentativeOuverte = await prisma.demandeTentative.findFirst({ where: { demandeId, statut: 'notifie' }, select: { id: true } });
  if (tentativeOuverte) return null;

  const tentativesExistantes = await prisma.demandeTentative.findMany({ where: { demandeId } });
  const idsDejaContactes = tentativesExistantes.map((t) => t.prestataireId);
  const prochainOrdre = tentativesExistantes.length + 1;
  const rayonCible = prochainOrdre > TENTATIVES_AVANT_ELARGISSEMENT
    ? RAYON_INITIAL_M * 2 ** (prochainOrdre - TENTATIVES_AVANT_ELARGISSEMENT)
    : RAYON_INITIAL_M;
  let rayonActuel = demande.rayonDiffusionActuelM;
  if (rayonCible > rayonActuel) {
    rayonActuel = rayonCible;
    await prisma.demande.update({ where: { id: demandeId }, data: { rayonDiffusionActuelM: rayonActuel } });
  }

  const prestataires = await listerPrestatairesParProximite(demande.latitudeClient, demande.longitudeClient, demande.categorieId);
  const candidat = prestataires.find((p) => p.statutDisponibilite === 'disponible' && !idsDejaContactes.includes(p.id) && p.distanceM <= rayonActuel);
  if (!candidat) return null;
  const tentative = await prisma.demandeTentative.create({
    data: { demandeId, prestataireId: candidat.id, ordreTentative: prochainOrdre, distanceM: candidat.distanceM, statut: 'notifie' },
  });
  await planifierExpirationTentative(tentative.id, demandeId, DELAI_REPONSE_MS);
  return tentative;
}

export async function executerExpirationTentative(tentativeId: string, demandeId: string) {
  const maj = await prisma.demandeTentative.updateMany({
    where: { id: tentativeId, statut: 'notifie' },
    data: { statut: 'expire', dateReponse: new Date() },
  });
  if (maj.count > 0) await planifierProchainPrestataire(demandeId);
}
