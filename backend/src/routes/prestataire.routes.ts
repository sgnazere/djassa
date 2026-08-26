import { Router } from 'express';
import { listerPrestatairesParProximite } from '../services/prestataire.service';

const router = Router();

router.get('/prestataires', async (req, res) => {
  const { lat, lng, categorieId } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Les paramètres lat et lng sont requis' });
  }

  try {
    const prestataires = await listerPrestatairesParProximite(
      parseFloat(lat as string),
      parseFloat(lng as string),
      categorieId as string | undefined
    );
    res.json(prestataires);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des prestataires' });
  }
});

export default router;