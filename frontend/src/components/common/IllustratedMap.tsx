import React from 'react';
import './IllustratedMap.css';

/**
 * Hand-drawn-style illustrated map of the Paso Centurión / Tinambú area.
 * Pure inline SVG so it scales nicely, supports theming via CSS variables and
 * has no external dependencies.
 *
 * Geography matches Google Maps reference:
 *  - Río Yaguarón: enters from the NE, makes a pronounced S-curve southward,
 *    forming the UY/BR border. URUGUAY is west, BRASIL is east.
 *  - Centurión: small locality at the SW.
 *  - Tinambú · Paso Centurión Tours: roughly mid-way between Centurión and the
 *    river, on Ruta 7 (the highlighted point — that's us).
 *  - Paso del Centurión: locality on the river bank to the east.
 *  - Restos de la Aduana: historic ruins right by the river crossing.
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
            River centerline used as a clip border between the two countries
            and as the visible water stroke. Coordinates picked to match the
            S-curve in the reference image:
              - Enters top right (~x=920, y=0)
              - Bends west to a pinch around (~x=720, y=180) [Paso del Centurión]
              - Comes back east to (~x=820, y=360)
              - Bends sharply west again at the bottom (~x=600, y=560)
              - Exits bottom (~x=560, y=600)
          */}
          <path
            id="riverPath"
            d="M 920 0
               C 880 60, 800 100, 740 170
               C 700 215, 700 240, 760 280
               C 820 320, 850 350, 820 410
               C 800 460, 720 500, 640 550
               C 600 575, 580 590, 560 600"
          />
          {/* Closed polygon for Brazil's land mass east of the river */}
          <path
            id="brasilLand"
            d="M 920 0
               L 1000 0
               L 1000 600
               L 560 600
               C 580 590, 600 575, 640 550
               C 720 500, 800 460, 820 410
               C 850 350, 820 320, 760 280
               C 700 240, 700 215, 740 170
               C 800 100, 880 60, 920 0 Z"
          />
        </defs>

        {/* Uruguayan land = full background */}
        <rect x="0" y="0" width="1000" height="600" fill="url(#landGradient)" />

        {/* Brazilian land = polygon east of the river */}
        <use href="#brasilLand" fill="url(#brasilGradient)" opacity="0.78" />

        {/* Subtle hills on the Uruguayan side */}
        <g className="illustrated-map__hills" opacity="0.5">
          <path d="M 100 360 Q 145 325 190 360 Q 230 388 270 360 L 270 388 L 100 388 Z" fill="var(--imap-hill)" />
          <path d="M 360 200 Q 405 165 450 200 Q 495 230 540 200 L 540 228 L 360 228 Z" fill="var(--imap-hill)" />
          <path d="M 470 470 Q 515 435 560 470 Q 595 495 615 470 L 615 498 L 470 498 Z" fill="var(--imap-hill)" />
        </g>

        {/* Decorative trees scattered around */}
        <g className="illustrated-map__trees" fill="var(--imap-tree)">
          <circle cx="180" cy="180" r="8" />
          <circle cx="195" cy="188" r="6" />
          <circle cx="240" cy="430" r="9" />
          <circle cx="255" cy="436" r="6" />
          <circle cx="430" cy="120" r="7" />
          <circle cx="445" cy="128" r="6" />
          <circle cx="510" cy="450" r="8" />
          <circle cx="525" cy="458" r="6" />
          <circle cx="900" cy="450" r="7" opacity="0.65" />
          <circle cx="915" cy="458" r="6" opacity="0.65" />
          <circle cx="950" cy="200" r="7" opacity="0.65" />
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

        {/* Ruta 7: dashed road from Centurión (SW) → Tinambú → Paso del Centurión */}
        <path
          d="M 80 510
             Q 180 470 270 430
             Q 350 395 430 380
             Q 540 365 660 240
             Q 700 200 740 175"
          stroke="var(--imap-road)"
          strokeWidth="3"
          strokeDasharray="10 8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Country labels — positioned where the river clearly separates UY from BR */}
        <text x="220" y="90" className="illustrated-map__country">URUGUAY</text>
        <text x="900" y="90" className="illustrated-map__country">BRASIL</text>
        {/* Second pair where the river bends west at the bottom: Brasil ends up south */}
        <text x="380" y="565" className="illustrated-map__country illustrated-map__country--small">URUGUAY</text>
        <text x="800" y="565" className="illustrated-map__country illustrated-map__country--small">BRASIL</text>

        {/* River label, rotated to follow the river's slope */}
        <text x="850" y="320" transform="rotate(72 850 320)" className="illustrated-map__river-label">
          Río Yaguarón
        </text>

        {/* Ruta 7 label */}
        <text x="380" y="400" className="illustrated-map__road-label">Ruta 7</text>

        {/* === Centurión (SW) === */}
        <g className="illustrated-map__poi">
          <circle cx="80" cy="510" r="9" fill="var(--imap-poi)" stroke="var(--imap-poi-border)" strokeWidth="2.5" />
          <text x="80" y="540" className="illustrated-map__poi-label">Centurión</text>
        </g>

        {/* === Paso del Centurión (locality on the river) === */}
        <g className="illustrated-map__poi">
          <circle cx="755" cy="200" r="8" fill="var(--imap-poi)" stroke="var(--imap-poi-border)" strokeWidth="2.5" />
          <text x="755" y="180" className="illustrated-map__poi-label">Paso del Centurión</text>
        </g>

        {/* === Restos de la Aduana (right at the river crossing) === */}
        <g className="illustrated-map__poi">
          <rect x="735" y="222" width="14" height="14" rx="1.5"
            fill="var(--imap-poi)" stroke="var(--imap-poi-border)" strokeWidth="2.5" />
          <line x1="738" y1="222" x2="738" y2="214" stroke="var(--imap-poi-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="742" y1="222" x2="742" y2="212" stroke="var(--imap-poi-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="746" y1="222" x2="746" y2="214" stroke="var(--imap-poi-border)" strokeWidth="2" strokeLinecap="round" />
          <text x="742" y="258" className="illustrated-map__poi-label illustrated-map__poi-label--sm">Restos de la Aduana</text>
        </g>

        {/* === Tinambú · Paso Centurión Tours (highlighted, on Ruta 7) === */}
        <g className="illustrated-map__poi illustrated-map__poi--highlight" filter="url(#pinShadow)">
          <circle cx="430" cy="380" r="22" fill="var(--imap-pin-halo)" opacity="0.35" />
          <path
            d="M 430 360
               C 440 360, 448 368, 448 378
               C 448 392, 430 406, 430 406
               C 430 406, 412 392, 412 378
               C 412 368, 420 360, 430 360 Z"
            fill="var(--imap-pin)"
            stroke="var(--imap-pin-border)"
            strokeWidth="2"
          />
          <circle cx="430" cy="378" r="4" fill="var(--imap-pin-dot)" />
          <text x="430" y="430" className="illustrated-map__poi-label illustrated-map__poi-label--highlight">
            Tinambú
          </text>
          <text x="430" y="447" className="illustrated-map__poi-sublabel">
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
