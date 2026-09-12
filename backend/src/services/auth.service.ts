import { createHash, randomUUID } from 'node:crypto';
import { PrismaClient, type Prisma, type TypeCompte } from '@prisma/client';
import twilio from 'twilio';
import { environnement } from '../config/environnement';

const prisma = new PrismaClient();
const twilioClient = twilio(environnement.TWILIO_ACCOUNT_SID, environnement.TWILIO_AUTH_TOKEN);
const DUREE_ACCES = '15m';
const DUREE_ACTUALISATION_SECONDES = 7 * 24 * 60 * 60;

function empreinteJeton(jeton: string): string { return createHash('sha256').update(jeton).digest('hex'); }

async function signerJeton(utilisateurId: string, role: TypeCompte, jti: string, expiration: string) {
  const { SignJWT, importPKCS8 } = await import('jose');
  const clePrivee = await importPKCS8(environnement.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'), 'RS256');
  return new SignJWT({ role }).setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setSubject(utilisateurId).setJti(jti).setIssuer(environnement.JWT_ISSUER)
    .setAudience(environnement.JWT_AUDIENCE).setIssuedAt().setExpirationTime(expiration)
    .sign(await clePrivee);
}

async function creerPaireJetonsDansTransaction(tx: Prisma.TransactionClient, utilisateur: { id: string; typeCompte: TypeCompte }) {
  const id = randomUUID();
  const accessToken = await signerJeton(utilisateur.id, utilisateur.typeCompte, randomUUID(), DUREE_ACCES);
  const refreshToken = await signerJeton(utilisateur.id, utilisateur.typeCompte, id, `${DUREE_ACTUALISATION_SECONDES}s`);
  await tx.jetonActualisation.create({ data: { id, utilisateurId: utilisateur.id, empreinte: empreinteJeton(refreshToken), expireLe: new Date(Date.now() + DUREE_ACTUALISATION_SECONDES * 1000) } });
  return { id, paire: { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: 15 * 60 } };
}

async function creerPaireJetons(utilisateur: { id: string; typeCompte: TypeCompte }) {
  return (await prisma.$transaction((tx) => creerPaireJetonsDansTransaction(tx, utilisateur))).paire;
}

export async function envoyerCodeOtp(telephone: string) {
  const verification = await twilioClient.verify.v2.services(environnement.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to: telephone, channel: 'sms' });
  return { statut: verification.status };
}

export async function verifierCodeOtp(telephone: string, code: string, nom: string, typeCompte: 'client' | 'prestataire') {
  const verificationCheck = await twilioClient.verify.v2.services(environnement.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: telephone, code });
  if (verificationCheck.status !== 'approved') return { succes: false, message: 'Code invalide' };
  let utilisateur = await prisma.utilisateur.findUnique({ where: { telephone } });
  if (!utilisateur) utilisateur = await prisma.utilisateur.create({ data: { nom, telephone, typeCompte, statut: 'actif' } });
  if (utilisateur.statut !== 'actif') return { succes: false, message: 'Compte indisponible' };
  return { succes: true, utilisateur, ...(await creerPaireJetons(utilisateur)) };
}

export async function actualiserJetons(refreshToken: string) {
  try {
    const { importSPKI, jwtVerify } = await import('jose');
    const clePublique = await importSPKI(environnement.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), 'RS256');
    const { payload } = await jwtVerify(refreshToken, clePublique, { algorithms: ['RS256'], issuer: environnement.JWT_ISSUER, audience: environnement.JWT_AUDIENCE });
    if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') return null;
    const enregistrement = await prisma.jetonActualisation.findUnique({ where: { id: payload.jti }, include: { utilisateur: true } });
    if (!enregistrement || enregistrement.revoqueLe || enregistrement.expireLe <= new Date() || enregistrement.empreinte !== empreinteJeton(refreshToken) || enregistrement.utilisateur.statut !== 'actif') return null;
    return await prisma.$transaction(async (tx) => {
      const prochain = await creerPaireJetonsDansTransaction(tx, enregistrement.utilisateur);
      await tx.jetonActualisation.update({ where: { id: enregistrement.id }, data: { revoqueLe: new Date(), remplaceParId: prochain.id } });
      return prochain.paire;
    });
  } catch { return null; }
}
