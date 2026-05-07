import React from 'react';
import './IllustratedMap.css';

/**
 * Hand-drawn-style illustrated map of the Paso Centurión / Tinambú area.
 * Pure inline SVG so it scales nicely, supports theming via CSS variables and
 * has no external dependencies.
 *
 * Geography (approximate, simplified for illustration):
 *  - Río Yaguarón: northeast → southeast, forming the UY/BR border.
 *  - URUGUAY: west of the river. BRASIL: east of the river.
 *  - Centurión (locality): west, connected by Ruta 7.
 *  - Paso del Centurión + Tinambú: where Ruta 7 reaches the river.
 *  - Restos de la Aduana: just north of Tinambú, by the river.
 */
const IllustratedMap: React.FC = () => {
  return (
    <div className="illustrated-map" role="img" aria-label="Mapa de Paso del Centurión">
      <svg
        viewBox="0 0 1000 600"
        xmlns="http://www.w3.org/2000/svg"
        className="illustrated-map__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Soft land gradient */}
          <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--imap-land-top)" />
            <stop offset="100%" stopColor="var(--imap-land-bottom)" />
          </linearGradient>
          {/* Brazil side, very subtly different */}
          <linearGradient id="brasilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--imap-land-br-top)" />
            <stop offset="100%" stopColor="var(--imap-land-br-bottom)" />
          </linearGradient>
          {/* River glow */}
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--imap-river)" />
            <stop offset="100%" stopColor="var(--imap-river-light)" />
          </linearGradient>
          {/* Tinambú marker drop-shadow */}
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" />
            <feComponentTransfer><feFuncA type="linear" slope="0.45" /></feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* === Land background === */}
        <rect x="0" y="0" width="1000" height="600" fill="url(#landGradient)" />

        {/* === Brazil side (east of the river) === */}
        <path
          d="M 720 0 L 1000 0 L 1000 600 L 760 600 Q 730 480 745 360 Q 762 240 720 120 Z"
          fill="url(#brasilGradient)"
          opacity="0.7"
        />

        {/* === Subtle hills on Uruguayan side === */}
        <g className="illustrated-map__hills" opacity="0.55">
          <path
            d="M 60 380 Q 110 340 160 380 Q 210 415 260 380 L 260 410 L 60 410 Z"
            fill="var(--imap-hill)"
          />
          <path
            d="M 360 250 Q 410 210 460 250 Q 510 280 560 250 L 560 280 L 360 280 Z"
            fill="var(--imap-hill)"
          />
          <path
            d="M 540 470 Q 590 430 640 470 Q 680 495 700 470 L 700 500 L 540 500 Z"
            fill="var(--imap-hill)"
          />
        </g>

        {/* === Decorative trees === */}
        <g className="illustrated-map__trees" fill="var(--imap-tree)">
          <circle cx="120" cy="170" r="8" />
          <circle cx="135" cy="178" r="6" />
          <circle cx="200" cy="450" r="9" />
          <circle cx="215" cy="455" r="6" />
          <circle cx="430" cy="120" r="7" />
          <circle cx="445" cy="128" r="6" />
          <circle cx="600" cy="430" r="8" />
          <circle cx="615" cy="438" r="6" />
          <circle cx="850" cy="320" r="7" opacity="0.65" />
          <circle cx="865" cy="328" r="6" opacity="0.65" />
          <circle cx="900" cy="500" r="7" opacity="0.65" />
        </g>

        {/* === Río Yaguarón (border with Brazil) === */}
        <path
          d="M 720 0
             C 700 80, 750 140, 730 220
             C 715 290, 760 340, 740 420
             C 725 480, 770 540, 760 600"
          stroke="url(#riverGradient)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          className="illustrated-map__river"
        />

        {/* === Ruta 7 (dashed road from Centurión to Paso Centurión) === */}
        <path
          d="M 130 320 Q 230 310 320 330 Q 430 360 520 350 Q 620 340 700 360"
          stroke="var(--imap-road)"
          strokeWidth="3"
          strokeDasharray="10 8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Country labels */}
        <text x="280" y="80" className="illustrated-map__country illustrated-map__country--uy">
          URUGUAY
        </text>
        <text x="870" y="80" className="illustrated-map__country illustrated-map__country--br">
          BRASIL
        </text>

        {/* River label */}
        <text x="780" y="270" className="illustrated-map__river-label" transform="rotate(80 780 270)">
          Río Yaguarón
        </text>

        {/* Ruta 7 label */}
        <text x="430" y="335" className="illustrated-map__road-label">
          Ruta 7
        </text>

        {/* === Centurión (locality) === */}
        <g className="illustrated-map__poi">
          <circle cx="130" cy="320" r="9" fill="var(--imap-poi)" stroke="var(--imap-poi-border)" strokeWidth="2.5" />
          <text x="130" y="300" className="illustrated-map__poi-label">Centurión</text>
        </g>

        {/* === Restos de la Aduana === */}
        <g className="illustrated-map__poi">
          <rect x="688" y="278" width="14" height="14" rx="1.5"
            fill="var(--imap-poi)" stroke="var(--imap-poi-border)" strokeWidth="2.5" />
          {/* tiny columns to suggest ruins */}
          <line x1="691" y1="278" x2="691" y2="270" stroke="var(--imap-poi-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="695" y1="278" x2="695" y2="268" stroke="var(--imap-poi-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="699" y1="278" x2="699" y2="270" stroke="var(--imap-poi-border)" strokeWidth="2" strokeLinecap="round" />
          <text x="695" y="258" className="illustrated-map__poi-label">Restos de la Aduana</text>
        </g>

        {/* === Paso del Centurión + Tinambú (highlighted) === */}
        <g className="illustrated-map__poi illustrated-map__poi--highlight" filter="url(#pinShadow)">
          {/* outer halo */}
          <circle cx="700" cy="360" r="22" fill="var(--imap-pin-halo)" opacity="0.35" />
          {/* pin shape */}
          <path
            d="M 700 340
               C 710 340, 718 348, 718 358
               C 718 372, 700 386, 700 386
               C 700 386, 682 372, 682 358
               C 682 348, 690 340, 700 340 Z"
            fill="var(--imap-pin)"
            stroke="var(--imap-pin-border)"
            strokeWidth="2"
          />
          <circle cx="700" cy="358" r="4" fill="var(--imap-pin-dot)" />
          <text x="700" y="408" className="illustrated-map__poi-label illustrated-map__poi-label--highlight">
            Paso del Centurión
          </text>
          <text x="700" y="425" className="illustrated-map__poi-sublabel">
            Tinambú · Paso Centurión Tours
          </text>
        </g>

        {/* === Compass === */}
        <g transform="translate(60, 60)" className="illustrated-map__compass">
          <circle cx="0" cy="0" r="20" fill="var(--imap-compass-bg)" stroke="var(--imap-compass-border)" strokeWidth="1.5" />
          <path d="M 0 -16 L 4 0 L 0 16 L -4 0 Z" fill="var(--imap-compass-needle)" />
          <text x="0" y="-26" className="illustrated-map__compass-label">N</text>
        </g>
      </svg>
    </div>
  );
};

export default IllustratedMap;
