import type { NextFunction, Request, Response } from 'express';

// Limiteur de débit en mémoire, par clé (adresse IP ou numéro de téléphone).
// Suffisant pour une instance unique ; à déplacer vers un stockage partagé
// (Redis) si l'API est un jour déployée sur plusieurs instances.

type Compteur = { total: number; expiration: number };

const compteurs = new Map<string, Compteur>();

// Purge périodique pour éviter que la table ne grossisse indéfiniment.
const INTERVALLE_PURGE_MS = 5 * 60 * 1000;
setInterval(() => {
  const maintenant = Date.now();
  for (const [cle, compteur] of compteurs) {
    if (compteur.expiration <= maintenant) compteurs.delete(cle);
  }
}, INTERVALLE_PURGE_MS).unref();

export function limiteurDebit(options: {
  fenetreMs: number;
  max: number;
  cle?: (req: Request) => string;
}) {
  const { fenetreMs, max, cle } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const identifiant = cle ? cle(req) : req.ip ?? 'inconnu';
    const maintenant = Date.now();

    let compteur = compteurs.get(identifiant);
    if (!compteur || compteur.expiration <= maintenant) {
      compteur = { total: 0, expiration: maintenant + fenetreMs };
      compteurs.set(identifiant, compteur);
    }

    compteur.total += 1;

    if (compteur.total > max) {
      const secondes = Math.ceil((compteur.expiration - maintenant) / 1000);
      res.setHeader('Retry-After', String(secondes));
      return res.status(429).json({ message: 'Trop de requêtes, réessayez plus tard' });
    }

    next();
  };
}