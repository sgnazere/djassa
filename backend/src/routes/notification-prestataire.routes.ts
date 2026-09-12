import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { getTentativeEnAttente } from '../services/notification-prestataire.service';
import { authentifier, autoriser } from '../middlewares/authentification';
import { valider } from '../middlewares/validation-schema';
import { journaliserErreur } from '../utils/journal';
const prisma = new PrismaClient();
const router = Router();
router.get('/prestataires/:id/tentative-en-attente', authentifier, autoriser('prestataire', 'admin'), valider(z.object({ id: z.string().uuid() }), 'params'), async (req, res) => {
  try {
    const prestataireId = String(req.params.id);
    const prestataire = await prisma.prestataire.findUnique({ where: { id: prestataireId }, select: { utilisateurId: true } });
    if (!prestataire) return res.status(404).json({ message: 'Prestataire introuvable' });
    if (req.authentification!.role !== 'admin' && prestataire.utilisateurId !== req.authentification!.utilisateurId) return res.status(403).json({ message: 'Accès interdit' });
    res.json(await getTentativeEnAttente(prestataireId));
  } catch (error) { journaliserErreur('GET /prestataires/:id/tentative-en-attente', error); res.status(500).json({ message: 'Erreur lors de la récupération' }); }
});
export default router;
