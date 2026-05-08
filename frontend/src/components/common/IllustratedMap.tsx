import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './IllustratedMap.css';

/**
 * Real interactive map of the Paso Centurión / Tinambú area.
 * Uses Leaflet + OpenStreetMap tiles (no API key, free).
 * Highlights Tinambú as the main location and shows the surrounding POIs.
 */

// Real coordinates (lat, lng)
const POIS = {
  TINAMBU: [-32.1394636, -53.762922] as LatLngExpression,
  // Centurión locality: SW of Tinambú, only slightly to the south.
  CENTURION: [-32.150, -53.84] as LatLngExpression,
  // Restos de la Aduana: north of Tinambú on the URUGUAYAN side of the river.
  ADUANA: [-32.115, -53.749] as LatLngExpression,
  // Paso del Centurión locality: just south of the Aduana, also on the UY side.
  PASO_CENTURION: [-32.121, -53.747] as LatLngExpression,
};

// Bounding box covering the four POIs with breathing room.
const REGION_BOUNDS: LatLngBoundsExpression = [
  [-32.165, -53.87],
  [-32.090, -53.71],
];

// Custom pin (highlighted) for Tinambú.
const tinambuIcon = L.divIcon({
  className: 'imap-pin imap-pin--main',
  html: `
    <div class="imap-pin__halo"></div>
    <svg viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M 18 0 C 8 0 0 8 0 18 C 0 32 18 48 18 48 C 18 48 36 32 36 18 C 36 8 28 0 18 0 Z"
            fill="currentColor" stroke="#fff" stroke-width="2"/>
      <circle cx="18" cy="18" r="6" fill="#fff"/>
    </svg>
  `,
  iconSize: [36, 48],
  iconAnchor: [18, 48],
  tooltipAnchor: [0, -42],
});

// Subtle dot for secondary POIs (Centurión, Paso del Centurión, Aduana).
// Just a small circle so the tooltip carries the meaning, not a giant pin.
const secondaryIcon = () => L.divIcon({
  className: 'imap-dot',
  html: `<span class="imap-dot__inner"></span>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  tooltipAnchor: [0, -4],
});

const FitBoundsOnMount: React.FC<{ bounds: LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  React.useEffect(() => {
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, bounds]);
  return null;
};

interface Props {
  /**
   * If true, switch to a dark tile layer that matches the dark theme.
   * The parent should pass the current theme so the map adapts.
   */
  dark?: boolean;
}

const IllustratedMap: React.FC<Props> = ({ dark = false }) => {
  // Detect theme automatically if not explicitly provided.
  const isDark = useMemo(() => {
    if (dark) return true;
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }, [dark]);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className={`illustrated-map ${isDark ? 'illustrated-map--dark' : ''}`}>
      <MapContainer
        bounds={REGION_BOUNDS}
        boundsOptions={{ padding: [40, 40] }}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={true}
        className="illustrated-map__leaflet"
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />
        <FitBoundsOnMount bounds={REGION_BOUNDS} />

        <Marker position={POIS.TINAMBU} icon={tinambuIcon}>
          <Tooltip permanent direction="bottom" offset={[0, 8]} className="imap-tooltip imap-tooltip--main">
            <strong>Tinambú</strong>
            <span>Paso Centurión Tours</span>
          </Tooltip>
        </Marker>

        <Marker position={POIS.CENTURION} icon={secondaryIcon()}>
          <Tooltip permanent direction="bottom" offset={[0, 6]} className="imap-tooltip">
            Centurión
          </Tooltip>
        </Marker>

        <Marker position={POIS.PASO_CENTURION} icon={secondaryIcon()}>
          <Tooltip permanent direction="bottom" offset={[0, 6]} className="imap-tooltip">
            Paso del Centurión
          </Tooltip>
        </Marker>

        <Marker position={POIS.ADUANA} icon={secondaryIcon()}>
          <Tooltip permanent direction="top" offset={[0, -6]} className="imap-tooltip">
            Restos de la Aduana
          </Tooltip>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default IllustratedMap;
