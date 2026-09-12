import type { TypeCompte } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      authentification?: { utilisateurId: string; role: TypeCompte; jti: string };
    }
  }
}

export {};
