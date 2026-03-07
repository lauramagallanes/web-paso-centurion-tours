import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AccommodationCard from '../../components/common/AccommodationCard';
import { alojamientoApiService, AlojamientoResponse } from '../../services/alojamientoApiService';
import './Accommodations.css';

const Accommodations: React.FC = () => {
  const [accommodations, setAccommodations] = useState<AlojamientoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Cache key for accommodations
  const CACHE_KEY = 'accommodations_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    loadAccommodations();
    loadFavorites();
  }, []);


  const loadAccommodations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < CACHE_DURATION) {
          setAccommodations(data);
          setLoading(false);
          return;
        }
      }
      
      // Reducir retries para carga más rápida: 1 retry (2 intentos totales), delay inicial de 1s
      const data = await alojamientoApiService.getAlojamientos(1, 1000);
      setAccommodations(data);
      
      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error loading accommodations:', err);
      setError('Error al cargar los alojamientos. Por favor, intenta de nuevo.');
      // Show mock data for development
      const mockData = getMockAccommodations();
      setAccommodations(mockData);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('accommodation-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  };


  const handleToggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
    localStorage.setItem('accommodation-favorites', JSON.stringify(Array.from(newFavorites)));
  };


  const getMockAccommodations = (): AlojamientoResponse[] => [
    {
      id: '1',
      nombre: 'Habitación Surucuá',
      descripcion: 'Habitación rústica con vista al bosque, ideal para parejas o familias pequeñas.',
      ubicacion: 'Paso Centurión, Uruguay - Ruta 7 km 439',
      capacidadMinima: 2,
      capacidadMaxima: 4,
      cantidadCamasDobles: 1,
      cantidadLiteras: 1,
      horaLlegada: '15:00',
      horaSalida: '11:00',
      precioPorNoche: 3000,
      imagenPrincipal: '',
      imagenes: [],
      totalImagenes: 0,
      tieneGaleria: false,
      activo: true,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    },
    {
      id: '2',
      nombre: 'Cabaña Familiar',
      descripcion: 'Cabaña espaciosa perfecta para familias grandes con dos habitaciones.',
      ubicacion: 'Paso Centurión, Uruguay - Ruta 7 km 439',
      capacidadMinima: 4,
      capacidadMaxima: 6,
      cantidadCamasDobles: 2,
      cantidadLiteras: 0,
      horaLlegada: '15:00',
      horaSalida: '11:00',
      precioPorNoche: 4500,
      imagenPrincipal: '',
      imagenes: [],
      totalImagenes: 0,
      tieneGaleria: false,
      activo: true,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    }
  ];

  if (loading) {
    return (
      <div className="accommodations-page">
        <div className="container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="accommodations-page">
      {/* Hero Section */}
      <section className="accommodations-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Nuestro Alojamiento</h1>
            <p className="hero-subtitle">
              Descubre nuestras opciones de hospedaje sustentable en medio de la naturaleza
            </p>
          </div>
        </div>
      </section>

      <section className="accommodations-content-section">
        <div className="container">
          {/* Error State */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadAccommodations} className="retry-btn">
                Reintentar
              </button>
            </div>
          )}

          {/* Accommodations Grid */}
          {accommodations.length > 0 ? (
            <div className="accommodations-grid">
              {accommodations
                .filter(accommodation => accommodation && accommodation.id)
                .map(accommodation => (
                  <AccommodationCard
                    key={accommodation.id}
                    accommodation={accommodation}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.has(accommodation.id)}
                  />
                ))}
            </div>
          ) : !loading && !error && (
            <div className="no-results">
              <MapPin size={48} />
              <h3>No hay alojamientos disponibles</h3>
              <p>Vuelve más tarde para ver nuestras opciones de alojamiento.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Accommodations;
