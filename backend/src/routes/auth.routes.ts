import { Router } from 'express';
import { z } from 'zod';
import { actualiserJetons, envoyerCodeOtp, verifierCodeOtp } from '../services/auth.service';
import { limiteurDebit } from '../middlewares/limiteur-debit';
import { valider } from '../middlewares/validation-schema';
import { journaliserErreur } from '../utils/journal';

const router = Router();
const telephone = z.string().regex(/^\+[1-9]\d{7,14}$/);
const limiteurAuth = limiteurDebit({ fenetreMs: 60_000, max: 10 });
const limiteurEnvoiParNumero = limiteurDebit({ fenetreMs: 60 * 60_000, max: 5, cle: (req) => `tel:${String(req.body?.telephone ?? 'inconnu')}` });

router.post('/auth/envoyer-code', limiteurAuth, limiteurEnvoiParNumero, valider(z.object({ telephone }).strict()), async (req, res) => {
  try { res.json(await envoyerCodeOtp(req.body.telephone)); }
  catch (error) { journaliserErreur('auth/envoyer-code', error); res.status(500).json({ message: "Erreur lors de l'envoi du code" }); }
});
router.post('/auth/verifier-code', limiteurAuth, valider(z.object({ telephone, code: z.string().regex(/^\d{4,10}$/), nom: z.string().trim().min(1).max(80), typeCompte: z.enum(['client', 'prestataire']) }).strict()), async (req, res) => {
  try { const resultat = await verifierCodeOtp(req.body.telephone, req.body.code, req.body.nom, req.body.typeCompte); res.status(resultat.succes ? 200 : 401).json(resultat); }
  catch (error) { journaliserErreur('auth/verifier-code', error); res.status(500).json({ message: 'Erreur lors de la vérification' }); }
});
router.post('/auth/rafraichir', limiteurAuth, valider(z.object({ refreshToken: z.string().min(100).max(10_000) }).strict()), async (req, res) => {
  const resultat = await actualiserJetons(req.body.refreshToken);
  if (!resultat) return res.status(401).json({ message: 'Jeton de rafraîchissement invalide ou expiré' });
  res.json(resultat);
});
export default router;
