import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { environnement } from '../config/environnement';
import { journaliserErreur } from '../utils/journal';
import { executerExpirationTentative, executerMatchingDemande } from './demande.service';

const NOM_FILE = 'matching-demandes';
type DonneesJob = { demandeId: string; tentativeId?: string };
const connexion = new IORedis(environnement.REDIS_URL, { maxRetriesPerRequest: null });
const fileMatching = new Queue<DonneesJob>(NOM_FILE, { connection: connexion });
let travailleur: Worker<DonneesJob> | undefined;
const optionsJob = { attempts: 5, backoff: { type: 'exponential' as const, delay: 1000 }, removeOnComplete: true, removeOnFail: 1000 };

export async function planifierProchainPrestataire(demandeId: string) {
  return fileMatching.add('matching', { demandeId }, { ...optionsJob, jobId: `matching-${demandeId}` });
}
export async function planifierExpirationTentative(tentativeId: string, demandeId: string, delaiMs: number) {
  return fileMatching.add('expiration', { tentativeId, demandeId }, { ...optionsJob, delay: delaiMs, jobId: `expiration-${tentativeId}` });
}
async function traiter(job: Job<DonneesJob>) {
  if (job.name === 'matching') return executerMatchingDemande(job.data.demandeId);
  if (job.name === 'expiration' && job.data.tentativeId) return executerExpirationTentative(job.data.tentativeId, job.data.demandeId);
  throw new Error(`Type de job inconnu: ${job.name}`);
}
export function demarrerTravailleurMatching() {
  if (travailleur) return travailleur;
  travailleur = new Worker<DonneesJob>(NOM_FILE, traiter, { connection: connexion.duplicate(), concurrency: 10 });
  travailleur.on('failed', (job, erreur) => journaliserErreur(`BullMQ ${job?.name ?? 'job'} ${job?.id ?? 'inconnu'}`, erreur));
  travailleur.on('error', (erreur) => journaliserErreur('BullMQ worker', erreur));
  return travailleur;
}
export async function arreterFileMatching() {
  await travailleur?.close();
  travailleur = undefined;
  await fileMatching.close();
  await connexion.quit();
}
