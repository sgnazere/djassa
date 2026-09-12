import type { TypeCompte } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { environnement } from '../config/environnement';

export async function authentifier(req: Request, res: Response, next: NextFunction) {
  const entete = req.header('authorization');
  if (!entete?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentification requise' });
  }

  try {
    const { importSPKI, jwtVerify } = await import('jose');
    const clePublique = await importSPKI(environnement.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), 'RS256');
    const { payload } = await jwtVerify(entete.slice(7), clePublique, {
      algorithms: ['RS256'], issuer: environnement.JWT_ISSUER, audience: environnement.JWT_AUDIENCE,
    });
    const role = payload.role;
    if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string' ||
        (role !== 'client' && role !== 'prestataire' && role !== 'admin')) {
      return res.status(401).json({ message: 'Jeton invalide' });
    }
    req.authentification = { utilisateurId: payload.sub, role: role as TypeCompte, jti: payload.jti };
    next();
  } catch {
    return res.status(401).json({ message: 'Jeton invalide ou expiré' });
  }
}

export function autoriser(...roles: TypeCompte[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authentification) return res.status(401).json({ message: 'Authentification requise' });
    if (!roles.includes(req.authentification.role)) return res.status(403).json({ message: 'Accès interdit' });
    next();
  };
}
