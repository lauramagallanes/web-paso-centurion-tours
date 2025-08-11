import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import AccommodationCard from '../../components/common/AccommodationCard';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import { routes } from '../../utils/routes';
import backgroundImage from '../../assets/illustrations/Foto home  conocenos.svg';
import './Accomodations.css';

interface Accommodation {
  id: string;
  name: string;
  description: string;
  image: string;
  capacity: { min: number; max: number };
  price: number;
  currency: string;
  amenities: string[];
  availability: boolean;
  rating?: number;
  location?: string;
  type?: 'cabin' | 'room' | 'suite' | 'house';
}

const Accomodations: React.FC = () => {
  const { getHabitaciones } = useApi();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'capacity' | 'rating'>('price');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });

  // Sample accommodations data (fallback if API fails)
  const sampleAccommodations: Accommodation[] = [
    {
      id: 'cabaña-bosque',
      name: 'Cabaña del Bosque',
      description: 'Acogedora cabaña familiar rodeada de vegetación nativa, construida con materiales locales y diseño sustentable. Perfecta para familias que buscan desconectar en la naturaleza.',
      image: '/src/assets/react.svg',
      capacity: { min: 2, max: 6 },
      price: 4500,
      currency: 'UYU',
      amenities: [
        'Cocina completa equipada',
        'Wi-Fi gratuito',
        'Parrilla privada',
        'Vista panorámica al bosque',
        'Estacionamiento privado',
        'Calefacción a leña',
        'Terraza con hamacas'
      ],
      availability: true,
      rating: 4.8,
      location: 'Zona Norte',
      type: 'cabin'
    },
    {
      id: 'habitacion-panoramica',
      name: 'Habitación Panorámica',
      description: 'Habitación doble con vista privilegiada al paisaje natural. Construida en barro con techo vivo, ofrece una experiencia auténtica de conexión con la naturaleza.',
      image: '/src/assets/react.svg',
      capacity: { min: 1, max: 2 },
      price: 2800,
      currency: 'UYU',
      amenities: [
        'Baño privado',
        'Aire acondicionado natural',
        'Minibar ecológico',
        'Vista panorámica',
        'Acceso al observatorio',
        'Desayuno incluido'
      ],
      availability: true,
      rating: 4.6,
      location: 'Zona Central',
      type: 'room'
    },
    {
      id: 'suite-naturaleza',
      name: 'Suite Naturaleza',
      description: 'Espaciosa suite con sala de estar independiente y terraza privada. Ideal para parejas que buscan una experiencia premium en contacto directo con la fauna local.',
      image: '/src/assets/react.svg',
      capacity: { min: 2, max: 3 },
      price: 6200,
      currency: 'UYU',
      amenities: [
        'Sala de estar privada',
        'Terraza con vista al río',
        'Jacuzzi al aire libre',
        'Servicio de habitación',
        'Minibar premium',
        'Biblioteca naturalista',
        'Binoculares incluidos'
      ],
      availability: true,
      rating: 4.9,
      location: 'Zona Sur',
      type: 'suite'
    },
    {
      id: 'casa-rural',
      name: 'Casa Rural Completa',
      description: 'Casa completa para grupos grandes, con múltiples habitaciones y espacios comunes. Perfecta para retiros familiares o grupos de amigos que buscan privacidad total.',
      image: '/src/assets/react.svg',
      capacity: { min: 6, max: 12 },
      price: 8900,
      currency: 'UYU',
      amenities: [
        '4 habitaciones',
        '3 baños completos',
        'Cocina industrial',
        'Sala de estar amplia',
        'Comedor para 12 personas',
        'Parrilla grande',
        'Jardín privado',
        'Estacionamiento para 4 autos'
      ],
      availability: false,
      rating: 4.7,
      location: 'Zona Oeste',
      type: 'house'
    }
  ];

  useEffect(() => {
    const fetchAccommodations = async () => {
      try {
        setLoading(true);
        const response = await getHabitaciones();
        if (response.success && response.data.length > 0) {
          // Transform API data to our format
          const transformedData = response.data.map((habitacion: any) => ({
            id: habitacion.id.toString(),
            name: habitacion.nombre,
            description: habitacion.descripcion,
            image: '/src/assets/react.svg',
            capacity: { min: 1, max: habitacion.capacidadMaxima },
            price: habitacion.precioPorNoche,
            currency: 'UYU',
            amenities: ['Baño privado', 'Vista a la naturaleza', 'Acceso al observatorio'],
            availability: true,
            rating: 4.5,
            type: 'room' as const
          }));
          setAccommodations(transformedData);
        } else {
          // Use sample data as fallback
          setAccommodations(sampleAccommodations);
        }
      } catch (err) {
        console.error('Error fetching accommodations:', err);
        // Use sample data as fallback
        setAccommodations(sampleAccommodations);
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodations();
  }, [getHabitaciones]);

  // Filter accommodations
  const filteredAccommodations = accommodations.filter(accommodation => {
    if (selectedType === 'all') return true;
    return accommodation.type === selectedType;
  }).filter(accommodation => {
    return accommodation.price >= priceRange.min && accommodation.price <= priceRange.max;
  });

  // Sort accommodations
  const sortedAccommodations = [...filteredAccommodations].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'capacity':
        return b.capacity.max - a.capacity.max;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  const handleBookAccommodation = (id: string) => {
    navigate(`${routes.book}?accommodation=${id}`);
  };

  const handleViewDetails = (id: string) => {
    navigate(`${routes.accomodations}/${id}`);
  };

  const accommodationTypes = [
    { value: 'all', label: 'Todos los Alojamientos', icon: '🏠' },
    { value: 'cabin', label: 'Cabañas', icon: '🏘️' },
    { value: 'room', label: 'Habitaciones', icon: '🛏️' },
    { value: 'suite', label: 'Suites', icon: '✨' },
    { value: 'house', label: 'Casas Rurales', icon: '🏡' }
  ];

  if (loading) {
    return (
      <div className="accommodations-page">
        <div className="accommodations-hero">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">Alojamiento Rural</h1>
              <p className="hero-subtitle">Cargando opciones de alojamiento...</p>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="loading-grid">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="loading-card">
                <CardBody>
                  <div className="loading-skeleton">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-title"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="accommodations-page">
      {/* Hero Section */}
      <section className="accommodations-hero">
        <div className="hero-background">
          <img 
            src={backgroundImage} 
            alt="Alojamientos en la naturaleza"
            className="hero-background-image"
          />
          <div className="hero-overlay" />
        </div>
        
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Alojamiento Rural Auténtico</h1>
            <p className="hero-subtitle">
              Descansa en armonía con la naturaleza. Nuestros alojamientos combinan 
              comodidad moderna con la autenticidad de la construcción sustentable.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{accommodations.length}</span>
                <span className="stat-label">Opciones Disponibles</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">100%</span>
                <span className="stat-label">Construcción Sustentable</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Contacto Directo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="accommodations-filters">
        <div className="container">
          <div className="filters-container">
            
            {/* Type Filters */}
            <div className="filter-group">
              <h3 className="filter-title">Tipo de Alojamiento</h3>
              <div className="filter-buttons">
                {accommodationTypes.map(type => (
                  <button
                    key={type.value}
                    className={`filter-button ${selectedType === type.value ? 'active' : ''}`}
                    onClick={() => setSelectedType(type.value)}
                  >
                    <span className="filter-icon">{type.icon}</span>
                    <span className="filter-label">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="filter-group">
              <h3 className="filter-title">Ordenar por</h3>
              <div className="sort-controls">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as 'price' | 'capacity' | 'rating')}
                  className="sort-select"
                >
                  <option value="price">Precio (menor a mayor)</option>
                  <option value="capacity">Capacidad (mayor a menor)</option>
                  <option value="rating">Calificación (mejor a menor)</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="results-info">
              <span className="results-count">
                {sortedAccommodations.length} alojamiento{sortedAccommodations.length !== 1 ? 's' : ''} encontrado{sortedAccommodations.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Accommodations Grid */}
      <section className="accommodations-content">
        <div className="container">
          {sortedAccommodations.length > 0 ? (
            <div className="accommodations-grid">
              {sortedAccommodations.map((accommodation) => (
                <AccommodationCard
                  key={accommodation.id}
                  {...accommodation}
                  onBook={handleBookAccommodation}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <Card variant="nature" size="lg" className="no-results-card">
                <CardBody>
                  <div className="no-results-content">
                    <div className="no-results-icon">🏠</div>
                    <h3 className="no-results-title">No hay alojamientos disponibles</h3>
                    <p className="no-results-description">
                      No encontramos alojamientos que coincidan con tus filtros. 
                      Intenta ajustar los criterios de búsqueda.
                    </p>
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setSelectedType('all');
                        setPriceRange({ min: 0, max: 10000 });
                      }}
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="accommodations-contact">
        <div className="container">
          <Card variant="booking" size="lg" className="contact-card">
            <CardBody>
              <div className="contact-content">
                <div className="contact-text">
                  <h3 className="contact-title">¿Necesitas ayuda con tu reserva?</h3>
                  <p className="contact-description">
                    Nuestro equipo está disponible 24/7 para ayudarte a encontrar 
                    el alojamiento perfecto y resolver todas tus consultas.
                  </p>
                </div>
                <div className="contact-actions">
                  <Button 
                    variant="primary" 
                    size="lg"
                    leftIcon="📞"
                    onClick={() => window.open('tel:+59898394653')}
                  >
                    Llamar Ahora
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    leftIcon="📧"
                    onClick={() => window.open('mailto:info@tinambu.com')}
                  >
                    Enviar Email
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Accomodations;