import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import SenderoCardV2 from '../../components/common/SenderoCardV2';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { routes } from '../../utils/routes';
// Imagen de fondo: foto específica para hero de actividades
const heroBackgroundImage = 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/activities/hero-activities.jpg';
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

import ContactModal from '../../components/common/ContactModal';

const Activities: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'difficulty'>('price');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Cache key for activities
  const CACHE_KEY = 'activities_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Load activities from API with cache
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < CACHE_DURATION) {
            setActivities(data);
          setLoading(false);
          return;
        }
      }
      
      const response = await apiService.getSenderos(1, 1000);
      
      if (response.success) {
        const fixedData = fixArrayEncoding(response.data);
        
        // Transform API data to our format with REAL data
        const transformedData = fixedData.map((sendero: any) => {
          // Map difficulty levels
          const difficultyMap: Record<string, string> = {
            'FACIL': 'Fácil',
            'MODERADO': 'Moderado', 
            'DIFICIL': 'Difícil',
            'EXPERTO': 'Experto'
          };
          
          // SIMPLE and ROBUST image selection - Priority: imagenPrincipal > urlImagen (legacy)
          let imagenUrl = '';
          if (sendero.imagenPrincipal && sendero.imagenPrincipal.trim() !== '') {
            imagenUrl = sendero.imagenPrincipal.trim();
          } else if (sendero.urlImagen && sendero.urlImagen.trim() !== '') {
            imagenUrl = sendero.urlImagen.trim();
          }
          // If both are empty, imagenUrl stays empty and component will show placeholder
          
          return {
            id: sendero.id,
            nombre: sendero.nombre,
            descripcion: sendero.descripcion,
            imagenUrl: imagenUrl, // Simple string, empty if no image
            duracion: `${sendero.duracionHoras} hora${sendero.duracionHoras !== 1 ? 's' : ''}`,
            dificultad: difficultyMap[sendero.nivelDificultad] || 'Moderado',
            precio: sendero.precioPorPersona,
            moneda: 'UYU',
            maxParticipants: sendero.capacidadMaximaGrupo,
            category: 'hiking' as const,
            location: 'Paso Centurión'
          };
        });
        setActivities(transformedData);
        
        // Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: transformedData,
          timestamp: Date.now()
        }));
      } else {
        console.error('❌ Error en respuesta:', response.error);
        setError(response.error || 'Error al cargar las actividades');
      }
    } catch (err) {
      console.error('❌ Error fetching activities después de todos los reintentos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión al cargar las actividades';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        <div className="activities-hero" style={{ backgroundImage: `url(${heroBackgroundImage})` }}>
          <div className="hero-overlay"></div>
          <div className="container">
            <div className="hero-content">
              <div className="hero-left">
                <h1 className="hero-title">Actividades y Experiencias Naturales</h1>
                <p className="hero-subtitle">
                  Senderos guiados por el Paisaje Protegido Paso Centurión. Observación de aves, 
                  reconocimiento de flora y fauna, e interpretación ambiental con guías especializados 
                  en grupos pequeños.
                </p>
              </div>
              <div className="hero-center">
                {/* Bird image area - kept free in the middle */}
              </div>
              <div className="hero-right">
                <div className="hero-highlights">
                  <div className="highlight-item">
                    <i className="bi bi-binoculars-fill highlight-icon"></i>
                    <span className="highlight-text">280+ especies de aves</span>
                  </div>
                  <div className="highlight-item">
                    <i className="bi bi-signpost-split highlight-icon"></i>
                    <span className="highlight-text">Senderos guiados</span>
                  </div>
                  <div className="highlight-item">
                    <i className="bi bi-person-walking highlight-icon"></i>
                    <span className="highlight-text">Guías de naturaleza y observación de aves</span>
                  </div>
                </div>
              </div>
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
                    onClick={fetchActivities}
                    disabled={loading}
                  >
                    {loading ? 'Cargando...' : 'Reintentar'}
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
      <section className="activities-hero" style={{ backgroundImage: `url(${heroBackgroundImage})` }}>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-left">
              <h1 className="hero-title">Actividades y Experiencias Naturales</h1>
              <p className="hero-subtitle">
                Senderos guiados por el Paisaje Protegido Paso Centurión. Observación de aves, 
                reconocimiento de flora y fauna, e interpretación ambiental con guías especializados 
                en grupos pequeños.
              </p>
            </div>
            <div className="hero-center">
              {/* Bird image area - kept free in the middle */}
            </div>
            <div className="hero-right">
              <div className="hero-highlights">
                <div className="highlight-item">
                  <i className="bi bi-binoculars-fill highlight-icon"></i>
                  <span className="highlight-text">280+ especies de aves</span>
                </div>
                <div className="highlight-item">
                  <i className="bi bi-signpost-split highlight-icon"></i>
                  <span className="highlight-text">Senderos guiados</span>
                </div>
                <div className="highlight-item">
                  <i className="bi bi-person-walking highlight-icon"></i>
                  <span className="highlight-text">Guías de naturaleza y observación de aves</span>
                </div>
              </div>
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
                <SenderoCardV2
                  key={activity.id}
                  id={activity.id}
                  nombre={activity.nombre}
                  descripcion={activity.descripcion}
                  imagenUrl={activity.imagenUrl}
                  duracion={activity.duracion}
                  dificultad={activity.dificultad}
                  precio={activity.precio}
                  moneda={activity.moneda}
                  maxParticipants={activity.maxParticipants}
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
                  <div className="info-icon">
                    <i className="bi bi-signpost-split"></i>
                  </div>
                  <h4 className="info-title">Senderos Guiados</h4>
                  <p className="info-description">
                    Contamos con una amplia variedad de senderos diseñados para diferentes 
                    intereses. Algunos están más enfocados en la observación de aves, otros 
                    en el reconocimiento de flora e interpretación ambiental. Hay opciones 
                    para todos los gustos y niveles de experiencia.
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card variant="nature" size="md" className="info-card">
              <CardBody>
                <div className="info-content">
                  <div className="info-icon">
                    <i className="bi bi-people"></i>
                  </div>
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
                  <div className="info-icon">
                    <i className="bi bi-person-badge"></i>
                  </div>
                  <h4 className="info-title">Guías de Naturaleza</h4>
                  <p className="info-description">
                    Nuestros guías especializados están enfocados en brindar una experiencia 
                    de conexión profunda con la naturaleza, educación ambiental, reconocimiento 
                    de flora y fauna, y observación de aves. Cada recorrido es una oportunidad 
                    de aprendizaje y descubrimiento.
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
          <Card variant="nature" size="lg" className="contact-card">
            <CardBody>
              <div className="contact-content">
                <div className="contact-text">
                  <div className="contact-icon-wrapper">
                    <i className="bi bi-chat-dots-fill"></i>
                  </div>
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
                    onClick={() => setIsContactModalOpen(true)}
                  >
                    <i className="bi bi-envelope-fill"></i>
                    Consultar Ahora
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => navigate(routes.about)}
                    className="btn-outline-cream"
                  >
                    <i className="bi bi-info-circle"></i>
                    Conocer Más
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Contact Modal */}
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
};

export default Activities;