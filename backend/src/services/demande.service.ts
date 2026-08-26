import { PrismaClient } from '@prisma/client';
import { listerPrestatairesParProximite } from './prestataire.service';

const prisma = new PrismaClient();

const RAYON_INITIAL_M = 2000;
const DELAI_REPONSE_MS = 20 * 1000; // 20 secondes
const TENTATIVES_AVANT_ELARGISSEMENT = 3;

export async function creerDemande(
  clientId: string,
  categorieId: string,
  latitudeClient: number,
  longitudeClient: number
) {
  const demande = await prisma.demande.create({
    data: {
      clientId,
      categorieId,
      latitudeClient,
      longitudeClient,
      statut: 'en_recherche',
      rayonDiffusionActuelM: RAYON_INITIAL_M,
    },
  });

  const tentative = await notifierProchainPrestataire(demande.id);

  return { demande, tentative };
}

export async function notifierProchainPrestataire(demandeId: string) {
  const demande = await prisma.demande.findUnique({ where: { id: demandeId } });
  if (!demande || demande.statut !== 'en_recherche') return null;

  const tentativesExistantes = await prisma.demandeTentative.findMany({
    where: { demandeId },
  });
  const idsDejaContactes = tentativesExistantes.map((t) => t.prestataireId);
  const prochainOrdre = tentativesExistantes.length + 1;

 // console.log('--- DEBUG notifierProchainPrestataire ---');
 // console.log('idsDejaContactes:', idsDejaContactes);
  //console.log('prochainOrdre:', prochainOrdre);

  // Élargissement du rayon après 3 tentatives
  let rayonActuel = demande.rayonDiffusionActuelM;
  if (prochainOrdre > TENTATIVES_AVANT_ELARGISSEMENT) {
    rayonActuel = rayonActuel * 2;
    await prisma.demande.update({
      where: { id: demandeId },
      data: { rayonDiffusionActuelM: rayonActuel },
    });
  }

  const prestataires = await listerPrestatairesParProximite(
    demande.latitudeClient,
    demande.longitudeClient,
    demande.categorieId
  );

  //console.log('prestataires trouvés:', prestataires.map(p => ({ id: p.id, nom: p.nomCommercial, statut: p.statutDisponibilite, distance: p.distanceM })));
  //console.log('rayonActuel:', rayonActuel);

  const candidat = prestataires.find(
    (p) =>
      p.statutDisponibilite === 'disponible' &&
      !idsDejaContactes.includes(p.id) &&
      p.distanceM <= rayonActuel
  );

    //console.log('candidat trouvé:', candidat ? candidat.nomCommercial : 'AUCUN');


  if (!candidat) {
    // Plus aucun candidat disponible dans le rayon actuel
    return null;
  }

  const tentative = await prisma.demandeTentative.create({
    data: {
      demandeId,
      prestataireId: candidat.id,
      ordreTentative: prochainOrdre,
      distanceM: candidat.distanceM,
      statut: 'notifie',
    },
  });

  // Programmer la relance automatique si personne ne répond à temps
  setTimeout(() => {
    expirerTentativeSiSansReponse(tentative.id, demandeId);
  }, DELAI_REPONSE_MS);

  return tentative;
}

async function expirerTentativeSiSansReponse(tentativeId: string, demandeId: string) {
  const tentative = await prisma.demandeTentative.findUnique({ where: { id: tentativeId } });
  if (!tentative || tentative.statut !== 'notifie') return; // déjà traitée entre-temps

  await prisma.demandeTentative.update({
    where: { id: tentativeId },
    data: { statut: 'expire', dateReponse: new Date() },
  });

  await notifierProchainPrestataire(demandeId);
}