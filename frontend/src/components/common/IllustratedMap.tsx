import React from 'react';
import './IllustratedMap.css';

/**
 * Hand-drawn-style illustrated map of the Paso Centurión / Tinambú area.
 * Pure inline SVG, theme-aware via CSS variables, no external dependencies.
 *
 * Geography (matches the Google Maps reference):
 *  - Río Yaguarón: enters from the NORTH and runs roughly N→S along the east
 *    side of the map, with a soft bend near the customs crossing and a final
 *    bend toward the SE. It forms the UY/BR border (UY west, BR east).
 *  - Centurión (locality): far SW.
 *  - Tinambú · Paso Centurión Tours: NORTH-CENTER, on Ruta 7. (That's us.)
 *  - Restos de la Aduana / cruce: where Ruta 7 meets the river (just N of
 *    Paso del Centurión).
 *  - Paso del Centurión (locality): south-east, on the river bank.
 *  - Ruta 7: dashed road, SW (Centurión) → NE (Tinambú) → river crossing.
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
          <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--imap-land-top)" />
            <stop offset="100%" stopColor="var(--imap-land-bottom)" />
          </linearGradient>
          <linearGradient id="brasilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--imap-land-br-top)" />
            <stop offset="100%" stopColor="var(--imap-land-br-bottom)" />
          </linearGradient>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--imap-river)" />
            <stop offset="100%" stopColor="var(--imap-river-light)" />
          </linearGradient>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" />
            <feComponentTransfer><feFuncA type="linear" slope="0.45" /></feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/*
            River centerline.
            - Enters the map from the NORTH at x≈720.
            - Soft west-leaning curve around the crossing (y≈230).
            - Slight west bulge where Paso del Centurión sits (y≈400).
            - Bends SE in the southern stretch, exits south near x≈830.
          */}
          <path
            id="riverPath"
            d="M 720 0
               C 715 80, 700 150, 700 220
               C 700 280, 670 340, 670 400
               C 670 460, 730 520, 800 560
               C 820 580, 830 590, 830 600"
          />

          {/* Brazilian land east of the river (filled polygon) */}
          <path
            id="brasilLand"
            d="M 720 0
               L 1000 0
               L 1000 600
               L 830 600
               C 830 590, 820 580, 800 560
               C 730 520, 670 460, 670 400
               C 670 340, 700 280, 700 220
               C 700 150, 715 80, 720 0 Z"
          />
        </defs>

        {/* Uruguayan land */}
        <rect x="0" y="0" width="1000" height="600" fill="url(#landGradient)" />

        {/* Brazilian land east of the river */}
        <use href="#brasilLand" fill="url(#brasilGradient)" opacity="0.78" />

        {/* Subtle hills on the Uruguayan side */}
        <g className="illustrated-map__hills" opacity="0.5">
          <path d="M 90 360 Q 135 325 180 360 Q 220 388 260 360 L 260 388 L 90 388 Z" fill="var(--imap-hill)" />
          <path d="M 320 280 Q 365 245 410 280 Q 455 308 500 280 L 500 308 L 320 308 Z" fill="var(--imap-hill)" />
          <path d="M 460 470 Q 505 435 550 470 Q 585 495 605 470 L 605 498 L 460 498 Z" fill="var(--imap-hill)" />
        </g>

        {/* Decorative trees */}
        <g className="illustrated-map__trees" fill="var(--imap-tree)">
          <circle cx="120" cy="240" r="8" />
          <circle cx="135" cy="248" r="6" />
          <circle cx="220" cy="430" r="9" />
          <circle cx="235" cy="436" r="6" />
          <circle cx="260" cy="120" r="7" />
          <circle cx="275" cy="128" r="6" />
          <circle cx="540" cy="430" r="8" />
          <circle cx="555" cy="438" r="6" />
          <circle cx="900" cy="280" r="7" opacity="0.65" />
          <circle cx="915" cy="288" r="6" opacity="0.65" />
          <circle cx="950" cy="120" r="7" opacity="0.65" />
        </g>

        {/* Río Yaguarón */}
        <use
          href="#riverPath"
          stroke="url(#riverGradient)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          className="illustrated-map__river"
        />

        {/* Ruta 7: dashed, Centurión (SW) → Tinambú (N-center) → river crossing */}
        <path
          d="M 80 520
             Q 200 470 290 380
             Q 360 310 410 240
             Q 470 180 560 200
             Q 640 220 700 230"
          stroke="var(--imap-road)"
          strokeWidth="3"
          strokeDasharray="10 8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Country labels — clear separation top */}
        <text x="320" y="80" className="illustrated-map__country">URUGUAY</text>
        <text x="880" y="80" className="illustrated-map__country">BRASIL</text>
        {/* Bottom pair: river bends SE, so labels track the new orientation */}
        <text x="380" y="565" className="illustrated-map__country illustrated-map__country--small">URUGUAY</text>
        <text x="900" y="450" className="illustrated-map__country illustrated-map__country--small">BRASIL</text>

        {/* River label, slight rotation to follow the river slope */}
        <text x="745" y="320" transform="rotate(82 745 320)" className="illustrated-map__river-label">
          Río Yaguarón
        </text>

        {/* Ruta 7 label */}
        <text x="320" y="380" transform="rotate(-30 320 380)" className="illustrated-map__road-label">
          Ruta 7
        </text>

        {/* === Centurión (SW) === */}
        <g className="illustrated-map__poi">
          <circle cx="80" cy="520" r="9" fill="var(--imap-poi)" stroke="var(--imap-poi-border)" strokeWidth="2.5" />
          <text x="80" y="550" className="illustrated-map__poi-label">Centurión</text>
        </g>

        {/* === Restos de la Aduana (river crossing, north of Paso del Centurión) === */}
        <g className="illustrated-map__poi">
          <rect x="688" y="222" width="14" height="14" rx="1.5"
            fill="var(--imap-poi)" stroke="var(--imap-poi-border)" strokeWidth="2.5" />
          <line x1="691" y1="222" x2="691" y2="214" stroke="var(--imap-poi-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="695" y1="222" x2="695" y2="212" stroke="var(--imap-poi-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="699" y1="222" x2="699" y2="214" stroke="var(--imap-poi-border)" strokeWidth="2" strokeLinecap="round" />
          <text x="695" y="200" className="illustrated-map__poi-label illustrated-map__poi-label--sm">
            Restos de la Aduana
          </text>
        </g>

        {/* === Paso del Centurión (locality, on the river to the south) === */}
        <g className="illustrated-map__poi">
          <circle cx="660" cy="410" r="8" fill="var(--imap-poi)" stroke="var(--imap-poi-border)" strokeWidth="2.5" />
          <text x="595" y="414" className="illustrated-map__poi-label illustrated-map__poi-label--sm" textAnchor="end">
            Paso del Centurión
          </text>
        </g>

        {/* === Tinambú · Paso Centurión Tours (highlighted, on Ruta 7, north-center) === */}
        <g className="illustrated-map__poi illustrated-map__poi--highlight" filter="url(#pinShadow)">
          <circle cx="430" cy="220" r="22" fill="var(--imap-pin-halo)" opacity="0.35" />
          <path
            d="M 430 200
               C 440 200, 448 208, 448 218
               C 448 232, 430 246, 430 246
               C 430 246, 412 232, 412 218
               C 412 208, 420 200, 430 200 Z"
            fill="var(--imap-pin)"
            stroke="var(--imap-pin-border)"
            strokeWidth="2"
          />
          <circle cx="430" cy="218" r="4" fill="var(--imap-pin-dot)" />
          <text x="430" y="270" className="illustrated-map__poi-label illustrated-map__poi-label--highlight">
            Tinambú
          </text>
          <text x="430" y="287" className="illustrated-map__poi-sublabel">
            Paso Centurión Tours
          </text>
        </g>

        {/* Compass */}
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
