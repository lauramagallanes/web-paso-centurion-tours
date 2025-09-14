import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import ActivityCard from '../../components/common/ActivityCard';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { routes } from '../../utils/routes';
import backgroundImage from '../../assets/illustrations/Foto home  conocenos.svg';
import { imageStorageService } from '../../services/imageStorageService';
import { fixArrayEncoding } from '../../utils/encodingFixer';
import './Activities.css';

interface Activity {
  id: string;
  name: string;
  description: string;
  imagenPrincipal: string;
  totalImagenes: number;
  tieneGaleria: boolean;
  duration: string;
  difficulty: 'Fácil' | 'Moderado' | 'Difícil';
  price: number;
  currency: string;
  maxParticipants: number;
  includes: string[];
  category?: 'hiking' | 'birdwatching' | 'photography' | 'nature' | 'adventure';
  location?: string;
}

const Activities: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'difficulty'>('price');

  // Load activities from API

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getSenderos();
        if (response.success) {
          console.log('📊 Raw backend data:', response.data);
          
          // Fix encoding issues first
          const fixedData = fixArrayEncoding(response.data);
          console.log('🔧 Fixed encoding data:', fixedData);
          
          // Transform API data to our format with REAL data
          const transformedData = fixedData.map((sendero: any) => {
            // Get real images from localStorage
            const imageStats = imageStorageService.getSenderoImageStats(sendero.id);
            const senderoImages = imageStorageService.getSenderoImages(sendero.id);
            
            // Map difficulty levels
            const difficultyMap: Record<string, string> = {
              'FACIL': 'Fácil',
              'MODERADO': 'Moderado', 
              'DIFICIL': 'Difícil',
              'EXPERTO': 'Experto'
            };
            
            console.log(`📊 Sendero ${sendero.nombre}:`, {
              hasImages: imageStats.total > 0,
              imageCount: imageStats.total,
              principalImage: imageStats.principal?.url
            });
            
            return {
              id: sendero.id,
              name: sendero.nombre,
              description: sendero.descripcion,
              imagenPrincipal: imageStats.principal?.url || sendero.imagenPrincipal || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=500&h=300&fit=crop',
              totalImagenes: imageStats.total,
              tieneGaleria: imageStats.total > 1,
              duration: `${sendero.duracionHoras} hora${sendero.duracionHoras !== 1 ? 's' : ''}`,
              difficulty: difficultyMap[sendero.nivelDificultad] || 'Moderado',
              price: sendero.precioPorPersona,
              currency: 'UYU',
              maxParticipants: sendero.capacidadMaximaGrupo,
              includes: [
                'Guía especializado',
                'Equipo básico de seguridad', 
                'Refrigerio natural'
              ],
              category: 'hiking' as const,
              location: 'Paso Centurión'
            };
          });
          setActivities(transformedData);
        } else {
          setError(response.error || 'Error al cargar las actividades');
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Error de conexión al cargar las actividades');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (selectedCategory !== 'all' && activity.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && activity.difficulty !== selectedDifficulty) return false;
    return true;
  });

  // Sort activities
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'duration':
        // Extract hours from duration string for comparison
        const getDurationHours = (duration: string) => {
          const match = duration.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        return getDurationHours(a.duration) - getDurationHours(b.duration);
      case 'difficulty':
        const difficultyOrder = { 'Fácil': 1, 'Moderado': 2, 'Difícil': 3, 'Experto': 4 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      default:
        return 0;
    }
  });

  const handleBookActivity = (id: string) => {
    navigate(`${routes.book}?activity=${id}`);
  };

  const handleViewActivityDetails = (id: string) => {
    navigate(`/actividades/${id}`);
  };

  const activityCategories = [
    { value: 'all', label: 'Todas las Actividades', icon: '🌿' },
    { value: 'birdwatching', label: 'Observación de Aves', icon: '🦅' },
    { value: 'hiking', label: 'Senderismo', icon: '🥾' },
    { value: 'photography', label: 'Fotografía', icon: '📷' },
    { value: 'adventure', label: 'Aventura', icon: '⛰️' },
    { value: 'nature', label: 'Naturaleza', icon: '🍃' }
  ];

  const difficultyLevels = [
    { value: 'all', label: 'Todos los Niveles', icon: '🎯' },
    { value: 'Fácil', label: 'Fácil', icon: '🟢' },
    { value: 'Moderado', label: 'Moderado', icon: '🟡' },
    { value: 'Difícil', label: 'Difícil', icon: '🟠' },
    { value: 'Experto', label: 'Experto', icon: '🔴' }
  ];

  if (loading) {
    return (
      <div className="activities-page">
        <div className="activities-hero">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">Actividades y Tours</h1>
              <p className="hero-subtitle">Cargando experiencias naturales...</p>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="activities-loading">
            <LoadingSpinner size="lg" />
            <p>Cargando actividades...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activities-page">
        <div className="activities-hero">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">Actividades y Tours</h1>
              <p className="hero-subtitle">Error al cargar las actividades</p>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="activities-error">
            <Card variant="nature" size="lg" className="error-card">
              <CardBody>
                <div className="error-content">
                  <div className="error-icon">⚠️</div>
                  <h3 className="error-title">No se pudieron cargar las actividades</h3>
                  <p className="error-description">{error}</p>
                  <Button 
                    variant="primary" 
                    onClick={() => window.location.reload()}
                  >
                    Reintentar
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activities-page">
      {/* Hero Section */}
      <section className="activities-hero">
        <div className="hero-background">
          <img 
            src={backgroundImage} 
            alt="Actividades en la naturaleza"
            className="hero-background-image"
          />
          <div className="hero-overlay" />
        </div>
        
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Actividades y Experiencias Naturales</h1>
            <p className="hero-subtitle">
              Sumérgete en la biodiversidad única de Paso Centurión. Desde observación 
              de aves especializada hasta aventuras nocturnas, cada experiencia está 
              diseñada para conectarte profundamente con la naturaleza.
            </p>
            <div className="hero-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🦅</span>
                <span className="highlight-text">280+ especies de aves</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🥾</span>
                <span className="highlight-text">7 senderos guiados</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">👨‍🏫</span>
                <span className="highlight-text">Guías especializados</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="activities-filters">
        <div className="container">
          <div className="filters-container">
            
            {/* Category Filters */}
            <div className="filter-group">
              <h3 className="filter-title">Tipo de Actividad</h3>
              <div className="filter-buttons">
                {activityCategories.map(category => (
                  <button
                    key={category.value}
                    className={`filter-button ${selectedCategory === category.value ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    <span className="filter-icon">{category.icon}</span>
                    <span className="filter-label">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filters */}
            <div className="filter-group">
              <h3 className="filter-title">Nivel de Dificultad</h3>
              <div className="filter-buttons">
                {difficultyLevels.map(level => (
                  <button
                    key={level.value}
                    className={`filter-button ${selectedDifficulty === level.value ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty(level.value)}
                  >
                    <span className="filter-icon">{level.icon}</span>
                    <span className="filter-label">{level.label}</span>
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
                  onChange={(e) => setSortBy(e.target.value as 'price' | 'duration' | 'difficulty')}
                  className="sort-select"
                >
                  <option value="price">Precio (menor a mayor)</option>
                  <option value="duration">Duración (menor a mayor)</option>
                  <option value="difficulty">Dificultad (fácil a experto)</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="results-info">
              <span className="results-count">
                {sortedActivities.length} actividad{sortedActivities.length !== 1 ? 'es' : ''} encontrada{sortedActivities.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Grid */}
      <section className="activities-content">
        <div className="container">
          {sortedActivities.length > 0 ? (
            <div className="activities-grid">
              {sortedActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  id={activity.id}
                  name={activity.name}
                  description={activity.description}
                  imagenPrincipal={activity.imagenPrincipal}
                  totalImagenes={activity.totalImagenes}
                  tieneGaleria={activity.tieneGaleria}
                  duration={activity.duration}
                  difficulty={activity.difficulty}
                  price={activity.price}
                  currency={activity.currency}
                  maxParticipants={activity.maxParticipants}
                  includes={activity.includes}
                  onBook={handleBookActivity}
                  onViewDetails={handleViewActivityDetails}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <Card variant="nature" size="lg" className="no-results-card">
                <CardBody>
                  <div className="no-results-content">
                    <div className="no-results-icon">🌿</div>
                    <h3 className="no-results-title">No hay actividades disponibles</h3>
                    <p className="no-results-description">
                      No encontramos actividades que coincidan con tus filtros. 
                      Intenta ajustar los criterios de búsqueda.
                    </p>
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedDifficulty('all');
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

      {/* Info Section */}
      <section className="activities-info">
        <div className="container">
          <div className="info-grid">
            <Card variant="nature" size="md" className="info-card">
              <CardBody>
                <div className="info-content">
                  <div className="info-icon">🌟</div>
                  <h4 className="info-title">Experiencias Auténticas</h4>
                  <p className="info-description">
                    Todas nuestras actividades están diseñadas por expertos locales 
                    para ofrecerte una conexión genuina con la naturaleza uruguaya.
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card variant="nature" size="md" className="info-card">
              <CardBody>
                <div className="info-content">
                  <div className="info-icon">👥</div>
                  <h4 className="info-title">Grupos Pequeños</h4>
                  <p className="info-description">
                    Limitamos el número de participantes para garantizar una 
                    experiencia personalizada y minimizar el impacto ambiental.
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card variant="nature" size="md" className="info-card">
              <CardBody>
                <div className="info-content">
                  <div className="info-icon">🛡️</div>
                  <h4 className="info-title">Seguridad Garantizada</h4>
                  <p className="info-description">
                    Todos nuestros guías están certificados y contamos con 
                    protocolos de seguridad para cada tipo de actividad.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="activities-contact">
        <div className="container">
          <Card variant="booking" size="lg" className="contact-card">
            <CardBody>
              <div className="contact-content">
                <div className="contact-text">
                  <h3 className="contact-title">¿Tienes alguna pregunta?</h3>
                  <p className="contact-description">
                    Nuestros guías especializados están disponibles para ayudarte 
                    a elegir la actividad perfecta según tus intereses y nivel de experiencia.
                  </p>
                </div>
                <div className="contact-actions">
                  <Button 
                    variant="primary" 
                    size="lg"
                    leftIcon="📞"
                    onClick={() => window.open('tel:+59898394653')}
                  >
                    Consultar Ahora
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => navigate(routes.about)}
                  >
                    Conocer Más
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

export default Activities;