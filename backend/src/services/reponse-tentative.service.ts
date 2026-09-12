import { PrismaClient } from '@prisma/client';
import { notifierProchainPrestataire } from './demande.service';

const prisma = new PrismaClient();

export async function accepterTentative(tentativeId: string) {
  const tentative = await prisma.demandeTentative.findUnique({
    where: { id: tentativeId },
    include: { demande: true },
  });

  if (!tentative) {
    return { succes: false, message: 'Tentative introuvable' };
  }

  if (tentative.statut !== 'notifie') {
    return { succes: false, message: 'Cette tentative a déjà reçu une réponse' };
  }

  if (tentative.demande.statut !== 'en_recherche') {
    return { succes: false, message: 'Cette demande a déjà été attribuée' };
  }

  // Le contrôle ci-dessus ne suffit pas : deux acceptations simultanées
  // peuvent le franchir toutes les deux. On ne fait donc avancer la demande
  // que si elle est *encore* « en_recherche » au moment de l'écriture, dans une
  // transaction qui annule tout si le compte de lignes modifiées est nul.
  try {
    return await prisma.$transaction(async (tx) => {
      const demandeMaj = await tx.demande.updateMany({
        where: { id: tentative.demandeId, statut: 'en_recherche' },
        data: {
          statut: 'acceptee',
          prestataireRetenuId: tentative.prestataireId,
          dateAcceptation: new Date(),
        },
      });

      if (demandeMaj.count === 0) {
        // Une autre tentative a été acceptée entre-temps : on abandonne.
        throw new ErreurTentativeDejaTraitee();
      }

      const tentativeMaj = await tx.demandeTentative.update({
        where: { id: tentativeId },
        data: { statut: 'accepte', dateReponse: new Date() },
      });

      const demande = await tx.demande.findUniqueOrThrow({
        where: { id: tentative.demandeId },
      });

      return { succes: true, tentative: tentativeMaj, demande };
    });
  } catch (error) {
    if (error instanceof ErreurTentativeDejaTraitee) {
      return { succes: false, message: 'Cette demande a déjà été attribuée' };
    }
    throw error;
  }
}

export async function declinerTentative(tentativeId: string) {
  const tentative = await prisma.demandeTentative.findUnique({
    where: { id: tentativeId },
  });

  if (!tentative) {
    return { succes: false, message: 'Tentative introuvable' };
  }

  if (tentative.statut !== 'notifie') {
    return { succes: false, message: 'Cette tentative a déjà reçu une réponse' };
  }

  // Mise à jour conditionnelle : si la tentative a été acceptée ou expirée
  // entre-temps, aucune ligne n'est modifiée et on ne relance pas la chaîne.
  const maj = await prisma.demandeTentative.updateMany({
    where: { id: tentativeId, statut: 'notifie' },
    data: { statut: 'decline', dateReponse: new Date() },
  });

  if (maj.count === 0) {
    return { succes: false, message: 'Cette tentative a déjà reçu une réponse' };
  }

  const prochaineTentative = await notifierProchainPrestataire(tentative.demandeId);

  return { succes: true, prochaineTentative };
}

class ErreurTentativeDejaTraitee extends Error {
  constructor() {
    super('Tentative déjà traitée');
    this.name = 'ErreurTentativeDejaTraitee';
  }
}