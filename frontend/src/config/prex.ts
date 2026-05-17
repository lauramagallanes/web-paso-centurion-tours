/**
 * Datos de la cuenta Prex donde el cliente debe realizar la transferencia.
 *
 * Pueden sobreescribirse vía variables de entorno Vite (VITE_PREX_*) sin tocar el código,
 * útil para distintos ambientes o si cambia el titular de la cuenta.
 */
export const PREX_ACCOUNT = {
  titular: import.meta.env.VITE_PREX_TITULAR || 'Laura Magallanes',
  cuenta: import.meta.env.VITE_PREX_CUENTA || '1643941',
  email: import.meta.env.VITE_PREX_EMAIL || 'info@pasocenturion.com.uy',
  asuntoEmail: import.meta.env.VITE_PREX_EMAIL_SUBJECT || 'Pago de reserva',
};

/** WhatsApp para enviar comprobante de transferencia Prex (solo dígitos, sin +, para wa.me). */
export const PREX_WHATSAPP_WA_ME = '59898372742';

/** Número visible para el usuario. */
export const PREX_WHATSAPP_DISPLAY = '+598 98 372 742';

export function prexComprobanteWhatsAppUrl(messageBody: string): string {
  return `https://wa.me/${PREX_WHATSAPP_WA_ME}?text=${encodeURIComponent(messageBody)}`;
}

/** Países donde Prex está disponible y por tanto se ofrece esta opción de pago. */
export const PREX_COUNTRIES = ['UY', 'AR', 'CL', 'PE'] as const;

export type PrexCountry = (typeof PREX_COUNTRIES)[number];
