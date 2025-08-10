import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import ActivityCard from '../../components/common/ActivityCard';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import { routes } from '../../utils/routes';
import './Activities.css';

interface Activity {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  difficulty: 'Fácil' | 'Moderado' | 'Difícil' | 'Experto';
  price: number;
  currency: string;
  maxParticipants: number;
  includes: string[];
  category?: 'hiking' | 'birdwatching' | 'photography' | 'nature' | 'adventure';
  location?: string;
  bestTime?: string;
  equipment?: string[];
}

const Activities: React.FC = () => {
  const { getSenderos } = useApi();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'difficulty'>('price');

  // Sample activities data (fallback if API fails)
  const sampleActivities: Activity[] = [
    {
      id: 'observacion-aves-matutina',
      name: 'Observación de Aves Matutina',
      description: 'Descubre la rica avifauna del amanecer con nuestros guías especializados en ornitología. Una experiencia única para fotógrafos y amantes de la naturaleza que incluye identificación de especies y técnicas de observación.',
      image: '/src/assets/react.svg',
      duration: '3-4 horas',
      difficulty: 'Fácil',
      price: 2500,
      currency: 'UYU',
      maxParticipants: 8,
      includes: [
        'Guía especializado en ornitología',
        'Binoculares profesionales Bushnell',
        'Desayuno campestre orgánico',
        'Material educativo y guía de especies',
        'Certificado de participación'
      ],
      category: 'birdwatching',
      location: 'Sendero del Mirador',
      bestTime: 'Amanecer (6:00 - 10:00)',
      equipment: ['Ropa cómoda', 'Calzado antideslizante', 'Protector solar', 'Gorra']
    },
    {
      id: 'sendero-biodiversidad',
      name: 'Sendero de la Biodiversidad',
      description: 'Caminata interpretativa por senderos naturales, conociendo la flora y fauna local en un recorrido educativo. Perfecto para familias y grupos que buscan aprender sobre los ecosistemas locales.',
      image: '/src/assets/react.svg',
      duration: '2-3 horas',
      difficulty: 'Moderado',
      price: 1800,
      currency: 'UYU',
      maxParticipants: 12,
      includes: [
        'Guía naturalista certificado',
        'Refrigerio natural a base de frutas locales',
        'Mapa detallado del sendero',
        'Lupa de campo para observación',
        'Certificado de participación'
      ],
      category: 'hiking',
      location: 'Sendero Principal',
      bestTime: 'Mañana o tarde',
      equipment: ['Calzado de trekking', 'Botella de agua', 'Mochila pequeña']
    },
    {
      id: 'fotografia-naturaleza',
      name: 'Fotografía de Naturaleza',
      description: 'Workshop de fotografía en plena naturaleza con un fotógrafo profesional. Aprende técnicas de macro, paisaje y fotografía de fauna mientras capturas la belleza única de Paso Centurión.',
      image: '/src/assets/react.svg',
      duration: '4-5 horas',
      difficulty: 'Moderado',
      price: 3200,
      currency: 'UYU',
      maxParticipants: 6,
      includes: [
        'Instructor fotógrafo profesional',
        'Acceso a ubicaciones exclusivas',
        'Tips de composición y técnica',
        'Revisión y edición básica de fotos',
        'Almuerzo campestre',
        'USB con las mejores fotos del grupo'
      ],
      category: 'photography',
      location: 'Diversos puntos panorámicos',
      bestTime: 'Hora dorada (mañana y tarde)',
      equipment: ['Cámara (réflex o mirrorless)', 'Trípode', 'Baterías extra', 'Tarjetas de memoria']
    },
    {
      id: 'aventura-nocturna',
      name: 'Aventura Nocturna',
      description: 'Experiencia única de senderismo nocturno para observar la fauna nocturna y disfrutar del cielo estrellado. Una aventura para los más intrépidos que buscan vivir la naturaleza de una forma completamente diferente.',
      image: '/src/assets/react.svg',
      duration: '3-4 horas',
      difficulty: 'Difícil',
      price: 2800,
      currency: 'UYU',
      maxParticipants: 8,
      includes: [
        'Guía especializado en fauna nocturna',
        'Linternas frontales profesionales',
        'Cena al aire libre',
        'Bebida caliente (té o chocolate)',
        'Manta térmica',
        'Observación astronómica básica'
      ],
      category: 'adventure',
      location: 'Sendero Nocturno Especial',
      bestTime: 'Noche (19:00 - 23:00)',
      equipment: ['Ropa de abrigo', 'Calzado con buena tracción', 'Repelente', 'Linterna personal']
    },
    {
      id: 'expedicion-completa',
      name: 'Expedición Naturalista Completa',
      description: 'La experiencia más completa que ofrecemos: día completo de actividades que incluye senderismo, observación de aves, fotografía y almuerzo gourmet. Para verdaderos amantes de la naturaleza.',
      image: '/src/assets/react.svg',
      duration: '8-9 horas',
      difficulty: 'Experto',
      price: 4800,
      currency: 'UYU',
      maxParticipants: 6,
      includes: [
        'Guía naturalista y ornitólogo',
        'Desayuno, almuerzo y merienda gourmet',
        'Equipo completo (binoculares, lupa, GPS)',
        'Transporte interno en el área',
        'Acceso a zonas restringidas',
        'Certificado de expedicionario',
        'Pack de recuerdos'
      ],
      category: 'nature',
      location: 'Recorrido completo del área',
      bestTime: 'Día completo (7:00 - 16:00)',
      equipment: ['Mochila grande', 'Ropa de trekking completa', 'Protección solar', 'Cámara']
    }
  ];

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await getSenderos();
        if (response.success && response.data.length > 0) {
          // Transform API data to our format
          const transformedData = response.data.map((sendero: any) => ({
            id: sendero.id.toString(),
            name: sendero.nombre,
            description: sendero.descripcion,
            image: '/src/assets/react.svg',
            duration: `${sendero.duracionEstimadaHoras} horas`,
            difficulty: sendero.dificultad === 'FACIL' ? 'Fácil' : 
                       sendero.dificultad === 'MODERADO' ? 'Moderado' : 
                       sendero.dificultad === 'DIFICIL' ? 'Difícil' : 'Experto',
            price: sendero.precioPorPersona || 2000,
            currency: 'UYU',
            maxParticipants: sendero.capacidadMaxima,
            includes: [
              'Guía especializado',
              'Equipo básico de seguridad',
              'Refrigerio natural'
            ],
            category: 'hiking' as const
          }));
          setActivities(transformedData);
        } else {
          // Use sample data as fallback
          setActivities(sampleActivities);
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
        // Use sample data as fallback
        setActivities(sampleActivities);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [getSenderos]);

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
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
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
    <div className="activities-page">
      {/* Hero Section */}
      <section className="activities-hero">
        <div className="hero-background">
          <img 
            src="/src/assets/illustrations/Foto home  conocenos.svg" 
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
                  {...activity}
                  onBook={handleBookActivity}
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