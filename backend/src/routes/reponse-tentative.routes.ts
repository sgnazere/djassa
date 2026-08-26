import { Router } from 'express';
import { accepterTentative, declinerTentative } from '../services/reponse-tentative.service';

const router = Router();

router.post('/tentatives/:id/accepter', async (req, res) => {
  try {
    const resultat = await accepterTentative(req.params.id);
    res.json(resultat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'acceptation' });
  }
});

router.post('/tentatives/:id/decliner', async (req, res) => {
  try {
    const resultat = await declinerTentative(req.params.id);
    res.json(resultat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors du refus' });
  }
});

export default router;