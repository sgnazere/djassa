// Journalisation d'erreur qui ne laisse jamais fuiter un secret.
// Les chaînes de connexion et les jetons présents dans un message d'erreur
// (Prisma, Twilio, ...) sont masqués avant écriture.

const MOTIFS_SECRETS: Array<[RegExp, string]> = [
  [/(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/\S+/gi, '$1://[url masquée]'],
  [/\bAC[0-9a-f]{32}\b/gi, '[identifiant Twilio masqué]'],
  [/\b[0-9a-f]{32}\b/gi, '[jeton masqué]'],
];

export function masquerSecrets(texte: string): string {
  return MOTIFS_SECRETS.reduce(
    (acc, [motif, remplacement]) => acc.replace(motif, remplacement),
    texte
  );
}

export function journaliserErreur(contexte: string, erreur: unknown): void {
  const nom = erreur instanceof Error ? erreur.name : 'ErreurInconnue';
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  console.error(`[${contexte}] ${nom}: ${masquerSecrets(message)}`);
}