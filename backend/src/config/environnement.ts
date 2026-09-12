import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schemaEnvironnement = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  JWT_ISSUER: z.string().url().default('https://api.djassa.local'),
  JWT_AUDIENCE: z.string().min(1).default('djassa-mobile'),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_VERIFY_SERVICE_SID: z.string().min(1),
  CORS_ORIGINS: z.string().default(''),
});

const resultat = schemaEnvironnement.safeParse(process.env);
if (!resultat.success) {
  const champs = resultat.error.issues.map((issue) => issue.path.join('.')).join(', ');
  throw new Error(`Configuration invalide ou incomplète : ${champs}`);
}

export const environnement = resultat.data;
export const originesAutorisees = environnement.CORS_ORIGINS.split(',')
  .map((origine) => origine.trim())
  .filter(Boolean);
