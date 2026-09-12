import { PrismaClient } from '@prisma/client';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { accepterTentative, declinerTentative } from '../services/reponse-tentative.service';
import { authentifier, autoriser } from '../middlewares/authentification';
import { valider } from '../middlewares/validation-schema';
import { journaliserErreur } from '../utils/journal';
const prisma = new PrismaClient();
const router = Router();
async function repondre(req: Request, res: Response, action: (id: string) => Promise<{ succes: boolean }>) {
  try {
    const tentativeId = String(req.params.id);
    const tentative = await prisma.demandeTentative.findUnique({ where: { id: tentativeId }, include: { prestataire: { select: { utilisateurId: true } } } });
    if (!tentative) return res.status(404).json({ message: 'Tentative introuvable' });
    if (req.authentification!.role !== 'admin' && tentative.prestataire.utilisateurId !== req.authentification!.utilisateurId) return res.status(403).json({ message: 'Accès interdit' });
    const resultat = await action(tentativeId);
    res.status(resultat.succes ? 200 : 409).json(resultat);
  } catch (error) { journaliserErreur('POST /tentatives', error); res.status(500).json({ message: 'Erreur lors du traitement' }); }
}
const protection = [authentifier, autoriser('prestataire', 'admin'), valider(z.object({ id: z.string().uuid() }), 'params')];
router.post('/tentatives/:id/accepter', ...protection, (req, res) => repondre(req, res, accepterTentative));
router.post('/tentatives/:id/decliner', ...protection, (req, res) => repondre(req, res, declinerTentative));
export default router;
