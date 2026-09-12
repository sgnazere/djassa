import { Router } from 'express';
import { listerCategories } from '../services/categorie.service';
import { journaliserErreur } from '../utils/journal';
import { authentifier } from '../middlewares/authentification';

const router = Router();

router.get('/categories', authentifier, async (req, res) => {
  try {
    const categories = await listerCategories();
    res.json(categories);
  } catch (error) {
    journaliserErreur('GET /categories', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des catégories' });
  }
});

export default router;
