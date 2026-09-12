// Validation des entrées externes.
// Toute valeur venant du client (corps, query, paramètres de route) passe par
// ici avant d'atteindre Prisma.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function estUuid(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && UUID_RE.test(valeur);
}

export function estNombreFini(valeur: unknown): valeur is number {
  return typeof valeur === 'number' && Number.isFinite(valeur);
}

export function estLatitude(valeur: unknown): valeur is number {
  return estNombreFini(valeur) && valeur >= -90 && valeur <= 90;
}

export function estLongitude(valeur: unknown): valeur is number {
  return estNombreFini(valeur) && valeur >= -180 && valeur <= 180;
}

export function estTexteNonVide(valeur: unknown, longueurMax: number): valeur is string {
  return (
    typeof valeur === 'string' &&
    valeur.trim().length > 0 &&
    valeur.length <= longueurMax
  );
}

// Format E.164 : un « + », puis 8 à 15 chiffres commençant par 1-9.
const TELEPHONE_RE = /^\+[1-9]\d{7,14}$/;

export function estTelephone(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && TELEPHONE_RE.test(valeur);
}

export const TYPES_COMPTE = ['client', 'prestataire'] as const;

export function estTypeCompte(valeur: unknown): valeur is (typeof TYPES_COMPTE)[number] {
  return typeof valeur === 'string' && (TYPES_COMPTE as readonly string[]).includes(valeur);
}

const CODE_OTP_RE = /^\d{4,10}$/;

export function estCodeOtp(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && CODE_OTP_RE.test(valeur);
}

// Convertit une valeur de query string en nombre fini, ou null.
export function nombreDepuisQuery(valeur: unknown): number | null {
  if (typeof valeur !== 'string' || valeur.trim() === '') return null;
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : null;
}