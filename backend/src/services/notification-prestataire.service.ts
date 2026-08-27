import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTentativeEnAttente(prestataireId: string) {
  return prisma.demandeTentative.findFirst({
    where: {
      prestataireId,
      statut: 'notifie',
    },
    include: {
      demande: {
        include: { categorie: true },
      },
    },
    orderBy: { dateNotification: 'desc' },
  });
}