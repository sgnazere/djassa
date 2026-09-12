import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

export function valider(schema: ZodType, cible: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const resultat = schema.safeParse(req[cible]);
    if (!resultat.success) return res.status(400).json({ message: 'Requête invalide' });
    Object.assign(req[cible], resultat.data);
    next();
  };
}
