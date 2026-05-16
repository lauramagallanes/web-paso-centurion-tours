/**
 * Datos de la cuenta Prex donde el cliente debe realizar la transferencia.
 *
 * Para producción, sustituir estos placeholders por los valores reales que te
 * proporcione el titular de la cuenta. También se pueden sobreescribir vía
 * variables de entorno Vite (VITE_PREX_*).
 */
export const PREX_ACCOUNT = {
  titular: import.meta.env.VITE_PREX_TITULAR || '[Titular de la cuenta Prex — a definir]',
  alias: import.meta.env.VITE_PREX_ALIAS || '[Alias Prex — a definir]',
  cuenta: import.meta.env.VITE_PREX_CUENTA || '[Número de cuenta — a definir]',
  documento: import.meta.env.VITE_PREX_DOCUMENTO || '[CI/RUT del titular — a definir]',
  telefono: import.meta.env.VITE_PREX_TELEFONO || '[Teléfono asociado — a definir]',
  email: import.meta.env.VITE_PREX_EMAIL || '[Email para notificar transferencia — a definir]',
};

/** Países donde Prex está disponible y por tanto se ofrece esta opción de pago. */
export const PREX_COUNTRIES = ['UY', 'AR', 'CL', 'PE'] as const;

export type PrexCountry = (typeof PREX_COUNTRIES)[number];
