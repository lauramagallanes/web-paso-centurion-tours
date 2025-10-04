import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Users } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AccommodationCard from '../../components/common/AccommodationCard';
import { alojamientoApiService, AlojamientoResponse } from '../../services/alojamientoApiService';
import './Accommodations.css';

const Accommodations: React.FC = () => {
  const [accommodations, setAccommodations] = useState<AlojamientoResponse[]>([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState<AlojamientoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [capacityFilter, setCapacityFilter] = useState('');

  useEffect(() => {
    loadAccommodations();
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [accommodations, searchTerm, priceRange, capacityFilter]);

  const loadAccommodations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alojamientoApiService.getAlojamientos();
      setAccommodations(data);
    } catch (err) {
      console.error('Error loading accommodations:', err);
      setError('Error al cargar los alojamientos. Por favor, intenta de nuevo.');
      // Show mock data for development
      setAccommodations(getMockAccommodations());
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

  const applyFilters = () => {
    let filtered = [...accommodations];

    // Search term filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(acc => 
        acc.nombre.toLowerCase().includes(search) ||
        (acc.descripcion && acc.descripcion.toLowerCase().includes(search)) ||
        (acc.ubicacion && acc.ubicacion.toLowerCase().includes(search))
      );
    }

    // Price range filter
    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min);
      filtered = filtered.filter(acc => acc.precioPorNoche >= minPrice);
    }
    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max);
      filtered = filtered.filter(acc => acc.precioPorNoche <= maxPrice);
    }

    // Capacity filter
    if (capacityFilter) {
      const capacity = parseInt(capacityFilter);
      filtered = filtered.filter(acc => acc.capacidadMaxima >= capacity);
    }

    setFilteredAccommodations(filtered);
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

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: '', max: '' });
    setCapacityFilter('');
    setShowFilters(false);
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
      <div className="container">
        {/* Header */}
        <div className="accommodations-header">
          <div className="breadcrumb">
            <span>Home</span> / <span>Alojamientos</span>
          </div>
          <h1>Nuestros Alojamientos</h1>
          <p>Descubre nuestras opciones de hospedaje en medio de la naturaleza</p>
        </div>

        {/* Search and Filters */}
        <div className="accommodations-controls">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar alojamientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button 
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            Filtros
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Precio por noche (UYU)</label>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="filter-group">
                <label>Capacidad mínima</label>
                <select
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                >
                  <option value="">Cualquier capacidad</option>
                  <option value="2">2+ personas</option>
                  <option value="4">4+ personas</option>
                  <option value="6">6+ personas</option>
                </select>
              </div>
            </div>
            
            <div className="filter-actions">
              <button onClick={clearFilters} className="clear-filters-btn">
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="results-info">
          <span>{filteredAccommodations.length} alojamiento{filteredAccommodations.length !== 1 ? 's' : ''} encontrado{filteredAccommodations.length !== 1 ? 's' : ''}</span>
        </div>

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
        {filteredAccommodations.length > 0 ? (
          <div className="accommodations-grid">
            {filteredAccommodations.map(accommodation => (
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
            <p>Intenta ajustar tus filtros de búsqueda o vuelve más tarde.</p>
            {(searchTerm || priceRange.min || priceRange.max || capacityFilter) && (
              <button onClick={clearFilters} className="clear-filters-btn">
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Accommodations;
