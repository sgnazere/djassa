import { Router } from 'express';
import { listerPrestatairesParProximite } from '../services/prestataire.service';
import {
  estLatitude,
  estLongitude,
  estUuid,
  nombreDepuisQuery,
} from '../utils/validation';
import { journaliserErreur } from '../utils/journal';
import { authentifier } from '../middlewares/authentification';

const router = Router();
const RAYON_MAXIMUM_M = 100_000;
const LIMITE_MAXIMALE = 20;

router.get('/prestataires', authentifier, async (req, res) => {
  const { lat, lng, categorieId, rayonM, limite } = req.query;

  const latitude = nombreDepuisQuery(lat);
  const longitude = nombreDepuisQuery(lng);

  if (latitude === null || !estLatitude(latitude)) {
    return res.status(400).json({ message: 'Paramètre lat invalide' });
  }
  if (longitude === null || !estLongitude(longitude)) {
    return res.status(400).json({ message: 'Paramètre lng invalide' });
  }
  if (categorieId !== undefined && !estUuid(categorieId)) {
    return res.status(400).json({ message: 'Paramètre categorieId invalide' });
  }

  const rayon = rayonM === undefined ? undefined : nombreDepuisQuery(rayonM);
  if (rayonM !== undefined && (rayon === null || rayon === undefined || rayon <= 0 || rayon > RAYON_MAXIMUM_M)) {
    return res.status(400).json({ message: `Parametre rayonM invalide (1 a ${RAYON_MAXIMUM_M})` });
  }
  const nombreLimite = limite === undefined ? undefined : nombreDepuisQuery(limite);
  if (limite !== undefined && (nombreLimite === null || nombreLimite === undefined || !Number.isInteger(nombreLimite) || nombreLimite < 1 || nombreLimite > LIMITE_MAXIMALE)) {
    return res.status(400).json({ message: `Parametre limite invalide (entier 1 a ${LIMITE_MAXIMALE})` });
  }

  try {
    const prestataires = await listerPrestatairesParProximite(
      latitude,
      longitude,
      {
        categorieId: categorieId as string | undefined,
        rayonM: rayon ?? undefined,
        limite: nombreLimite ?? undefined,
      }
    );
    res.json(prestataires);
  } catch (error) {
    journaliserErreur('GET /prestataires', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des prestataires' });
  }
});

export default router;
