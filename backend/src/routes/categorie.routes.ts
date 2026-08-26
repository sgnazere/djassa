import { Router } from 'express';
import { listerCategories } from '../services/categorie.service';

const router = Router();

router.get('/categories', async (req, res) => {
  try {
    const categories = await listerCategories();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des catégories' });
  }
});

export default router;