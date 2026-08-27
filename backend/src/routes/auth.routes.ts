import { Router } from 'express';
import { envoyerCodeOtp, verifierCodeOtp } from '../services/auth.service';

const router = Router();

router.post('/auth/envoyer-code', async (req, res) => {
  const { telephone } = req.body;
  if (!telephone) return res.status(400).json({ message: 'Téléphone requis' });

  try {
    const resultat = await envoyerCodeOtp(telephone);
    res.json(resultat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du code' });
  }
});

router.post('/auth/verifier-code', async (req, res) => {
  const { telephone, code, nom, typeCompte } = req.body;
  if (!telephone || !code || !nom || !typeCompte) {
    return res.status(400).json({ message: 'Champs manquants' });
  }

  try {
    const resultat = await verifierCodeOtp(telephone, code, nom, typeCompte);
    res.json(resultat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la vérification' });
  }
});

export default router;