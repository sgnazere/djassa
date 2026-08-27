import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

const prisma = new PrismaClient();

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

export async function envoyerCodeOtp(telephone: string) {
  const verification = await twilioClient.verify.v2
    .services(verifyServiceSid)
    .verifications.create({ to: telephone, channel: 'sms' });

  return { statut: verification.status };
}

export async function verifierCodeOtp(
  telephone: string,
  code: string,
  nom: string,
  typeCompte: 'client' | 'prestataire'
) {
  const verificationCheck = await twilioClient.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({ to: telephone, code });

  if (verificationCheck.status !== 'approved') {
    return { succes: false, message: 'Code invalide' };
  }

  // Code valide : on récupère ou crée l'utilisateur
  let utilisateur = await prisma.utilisateur.findUnique({ where: { telephone } });

  if (!utilisateur) {
    utilisateur = await prisma.utilisateur.create({
      data: { nom, telephone, typeCompte, statut: 'actif' },
    });
  }

  return { succes: true, utilisateur };
}