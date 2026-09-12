import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import categorieRoutes from './routes/categorie.routes';
import prestataireRoutes from './routes/prestataire.routes';
import demandeRoutes from './routes/demande.routes';
import reponseTentativeRoutes from './routes/reponse-tentative.routes';
import notificationPrestataireRoutes from './routes/notification-prestataire.routes';
import authRoutes from './routes/auth.routes';
import { journaliserErreur } from './utils/journal';
import { environnement, originesAutorisees } from './config/environnement';
import { arreterFileMatching, demarrerTravailleurMatching } from './services/file-matching.service';

const app = express();
const port = environnement.PORT;
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' }, hsts: environnement.NODE_ENV === 'production' ? undefined : false }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Trop de requêtes, réessayez plus tard' } }));

// Le client n'envoie que du JSON : on borne la taille pour éviter qu'un corps
// énorme ne sature la mémoire du processus.
app.use(express.json({ limit: '100kb' }));

// CORS restreint aux origines déclarées dans CORS_ORIGINS (liste séparée par
// des virgules). Sans variable définie, aucune origine externe n'est autorisée :
// l'application mobile n'est pas concernée (elle n'applique pas la same-origin).
app.use((req, res, next) => {
  const origine = req.headers.origin;
  if (origine && originesAutorisees.includes(origine)) {
    res.setHeader('Access-Control-Allow-Origin', origine);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api', categorieRoutes);
app.use('/api', prestataireRoutes);
app.use('/api', demandeRoutes);
app.use('/api', reponseTentativeRoutes);
app.use('/api', notificationPrestataireRoutes);
app.use('/api', authRoutes);

app.get('/', (req, res) => {
  res.send('API backend en ligne');
});

// Toute route inconnue répond en JSON, jamais avec la page HTML par défaut.
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

// Filet de sécurité : une erreur non rattrapée dans une route ne doit ni faire
// tomber le processus ni renvoyer la trace de la pile au client.
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  journaliserErreur(`${req.method} ${req.path}`, error);
  if (res.headersSent) return next(error);
  res.status(500).json({ message: 'Erreur interne' });
});

// NOTE SÉCURITÉ : aucun middleware d'authentification n'est monté. Les routes
// qui manipulent les données d'un utilisateur reçoivent aujourd'hui son
// identifiant depuis le corps de la requête, ce qui permet à n'importe qui de
// se faire passer pour lui. À corriger avant toute exposition publique :
// émettre un jeton à la fin de /auth/verifier-code, le vérifier ici, et
// déduire l'identité du jeton au lieu de la lire dans le corps.
demarrerTravailleurMatching();
const serveur = app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});

let arretEnCours = false;
async function arreter(signal: string) {
  if (arretEnCours) return;
  arretEnCours = true;
  console.log(`Arret propre (${signal})...`);
  serveur.close(async () => {
    try { await arreterFileMatching(); process.exitCode = 0; }
    catch (erreur) { journaliserErreur('Arret de la file BullMQ', erreur); process.exitCode = 1; }
  });
}
process.once('SIGINT', () => void arreter('SIGINT'));
process.once('SIGTERM', () => void arreter('SIGTERM'));
