import { PrismaClient } from '@prisma/client';
import { notifierProchainPrestataire } from './demande.service';

const prisma = new PrismaClient();

export async function accepterTentative(tentativeId: string) {
  const tentative = await prisma.demandeTentative.findUnique({
    where: { id: tentativeId },
    include: { demande: true },
  });

  if (!tentative) {
    throw new Error('Tentative introuvable');
  }

  if (tentative.demande.statut !== 'en_recherche') {
    return { succes: false, message: 'Cette demande a déjà été attribuée' };
  }

  const [tentativeMaj, demandeMaj] = await prisma.$transaction([
    prisma.demandeTentative.update({
      where: { id: tentativeId },
      data: { statut: 'accepte', dateReponse: new Date() },
    }),
    prisma.demande.update({
      where: { id: tentative.demandeId },
      data: {
        statut: 'acceptee',
        prestataireRetenuId: tentative.prestataireId,
        dateAcceptation: new Date(),
      },
    }),
  ]);

  return { succes: true, tentative: tentativeMaj, demande: demandeMaj };
}

export async function declinerTentative(tentativeId: string) {
  const tentative = await prisma.demandeTentative.update({
    where: { id: tentativeId },
    data: { statut: 'decline', dateReponse: new Date() },
  });

  const prochaineTentative = await notifierProchainPrestataire(tentative.demandeId);

  return { succes: true, prochaineTentative };
}