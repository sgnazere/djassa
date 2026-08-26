import { Router } from 'express';
import { creerDemande } from '../services/demande.service';

const router = Router();

router.post('/demandes', async (req, res) => {
  const { clientId, categorieId, latitude, longitude } = req.body;

  if (!clientId || !categorieId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Champs manquants' });
  }

  try {
    const resultat = await creerDemande(clientId, categorieId, latitude, longitude);
    res.status(201).json(resultat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de la demande' });
  }
});

export default router;