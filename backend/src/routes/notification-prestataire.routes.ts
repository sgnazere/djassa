import { Router } from 'express';
import { getTentativeEnAttente } from '../services/notification-prestataire.service';

const router = Router();

router.get('/prestataires/:id/tentative-en-attente', async (req, res) => {
  try {
    const tentative = await getTentativeEnAttente(req.params.id);
    res.json(tentative);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

export default router;