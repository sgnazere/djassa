import { Router } from 'express';
import { z } from 'zod';
import { creerDemande } from '../services/demande.service';
import { authentifier, autoriser } from '../middlewares/authentification';
import { valider } from '../middlewares/validation-schema';
import { journaliserErreur } from '../utils/journal';

const router = Router();
const uuid = z.string().uuid();
router.post('/demandes', authentifier, autoriser('client'), valider(z.object({ categorieId: uuid, latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180) }).strict()), async (req, res) => {
  try { res.status(201).json(await creerDemande(req.authentification!.utilisateurId, req.body.categorieId, req.body.latitude, req.body.longitude)); }
  catch (error) { journaliserErreur('POST /demandes', error); res.status(500).json({ message: 'Erreur lors de la création de la demande' }); }
});
export default router;
