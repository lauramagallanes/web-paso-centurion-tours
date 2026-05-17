import React from 'react';

/**
 * SVG inline de una cama con el mismo estilo de Bootstrap Icons (currentColor,
 * viewBox 16x16). Bootstrap Icons 1.13 no incluye `bi-bed`, así que usamos este
 * componente para mantener consistencia visual cuando representamos
 * "alojamiento".
 */
export const BedIcon: React.FC<{ className?: string; size?: string | number }> = ({
  className,
  size = '1em',
}) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="currentColor"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M1.5 4a.5.5 0 0 1 .5.5V8h11.5A1.5 1.5 0 0 1 15 9.5V13a.5.5 0 0 1-1 0v-1.5H2V13a.5.5 0 0 1-1 0V4.5a.5.5 0 0 1 .5-.5zM2 9v1.5h12V9.5a.5.5 0 0 0-.5-.5H2zm3.5-4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM9 7V5.5A1.5 1.5 0 0 1 10.5 4h2A1.5 1.5 0 0 1 14 5.5V7H9zm1-1.5V7h3V5.5a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5z" />
  </svg>
);

export default BedIcon;
