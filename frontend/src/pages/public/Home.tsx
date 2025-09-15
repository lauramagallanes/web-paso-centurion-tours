import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { imageStorageService } from '../../services/imageStorageService';
import { fixArrayEncoding } from '../../utils/encodingFixer';
import HeroSlider, { HeroSlide } from '../../components/common/HeroSlider';

import ActivityCard from '../../components/common/ActivityCard';
import AccommodationCard from '../../components/common/AccommodationCard';
import Button from '../../components/common/Button';
import { routes } from '../../utils/routes';
import backgroundImage from '../../assets/illustrations/Foto home  conocenos.svg';
import mapaImage from '../../assets/illustrations/mapa.svg';
import './Home.css';

interface FeaturedActivity {
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
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const ctaRef = useRef<HTMLElement>(null);
  
  // State for featured activities
  const [featuredActivities, setFeaturedActivities] = useState<FeaturedActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    // Apply background image to CTA section
    if (ctaRef.current) {
      ctaRef.current.style.setProperty('--mapa-background', `url(${mapaImage})`);
    }
    
    // Load featured activities
    loadFeaturedActivities();
  }, []);

  const loadFeaturedActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await apiService.getSenderos() as any;
      
      if (response.success) {
        console.log('🏠 Loading featured activities from real backend data');
        
        // Fix encoding issues first
        const fixedData = fixArrayEncoding(response.data);
        console.log('🔧 Fixed encoding data for featured activities:', fixedData.slice(0, 3));
        
        // Transform API data and take first 3 as featured with REAL data
        const transformedActivities = fixedData.slice(0, 3).map((sendero: any) => {
          // Get real images from localStorage
          const imageStats = imageStorageService.getSenderoImageStats(sendero.id);
          
          // Map difficulty levels
          const difficultyMap: Record<string, string> = {
            'FACIL': 'Fácil',
            'MODERADO': 'Moderado', 
            'DIFICIL': 'Difícil',
            'EXPERTO': 'Experto'
          };
          
          console.log(`🏠 Featured sendero ${sendero.nombre}:`, {
            realPrice: sendero.precioPorPersona,
            realDuration: sendero.duracionHoras,
            realDifficulty: sendero.nivelDificultad,
            hasRealImages: imageStats.total > 0,
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
            ]
          };
        });
        
        setFeaturedActivities(transformedActivities);
      }
    } catch (error) {
      console.error('❌ ERROR: Backend/API Gateway no está funcionando:', error);
      console.error('❌ URL del backend:', 'https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/senderos');
      console.error('❌ Todos los endpoints retornan: {"message":"Not Found"}');
      
      // TEMPORALMENTE COMENTADO - Para mostrar el error real en lugar de senderos hardcodeados
      // setFeaturedActivities([...]);
      
      // Show empty state instead of hardcoded data
      setFeaturedActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Hero slider data
  const heroSlides: HeroSlide[] = [
    {
      id: 'tinambu',
      type: 'tinambu',
      image: 'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/1737064268866.jpg',
      title: 'Tinambú',
      description: 'Alojamiento familiar en Paso Centurión. Aventura, descanso y naturaleza en un entorno protegido, con senderismo guiado, observación de aves y alojamiento sustentable, avalado por organismos ambientales y turísticos.',
      ctaText: 'Conocenos',
      ctaAction: () => navigate(routes.about),
      overlay: 'dark',
      certifications: [
        { icon: '🌿', name: 'Certificación Ambiental' },
        { icon: '🌿', name: 'Turismo Sustentable' }
      ]
    },
    {
      id: 'birdwatching',
      type: 'birds',
      image: 'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN4949+(2).jpg',
      title: 'Avistamiento de aves',
      description: 'Más de 200 especies en hábitats diversos. Observación guiada para amantes de las aves, la fotografía y la biodiversidad.',
      ctaText: 'Descubre',
      ctaAction: () => navigate(routes.activities),
      overlay: 'dark',
      gallery: [
        'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN2227.JPG',
        'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN2401.jpg',
        'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN6884.JPG'
      ]
    },
    {
      id: 'hiking',
      type: 'hiking',
      image: 'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN0810.JPG',
      title: 'Senderismo guiado',
      description: 'Tenemos 7 Senderos para que escojas, caminatas guiadas por naturaleza virgen. Explora bosques, quebradas y miradores junto a nuestros guías locales. Observa la flora, fauna y aves únicas en Uruguay.',
      ctaText: 'Reserva ahora',
      ctaAction: () => navigate(routes.book),
      overlay: 'dark'
    },
    {
      id: 'accommodation',
      type: 'accommodation',
      image: 'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/1737064268866.jpg',
      title: 'Alojamiento',
      description: 'Dos habitaciones en bioconstrucción con todo el confort, inmersas en naturaleza. Ideal para descansar, reconectar y observar aves.',
      ctaText: 'Reserva ahora',
      ctaAction: () => navigate(routes.accomodations),
      overlay: 'dark',
      gallery: [
        'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN7425.JPG',
        'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/1737064268783.jpg'
      ]
    },
    {
      id: 'birdwatching',
      type: 'birds',
      image: 'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN5964.JPG',
      title: 'Avistamiento de aves',
      description: 'Más de 200 especies en hábitats diversos. Observación guiada para amantes de las aves, la fotografía y la biodiversidad.',
      ctaText: 'Descubre',
      ctaAction: () => navigate(routes.activities),
      overlay: 'dark',
      gallery: [
        'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN1985.JPG',
        'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN4993.JPG',
        'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN5172.JPG'
      ]
    },
    {
      id: 'hiking',
      type: 'hiking',
      image: 'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN0683.JPG',
      title: 'Senderismo guiado',
      description: 'Tenemos 7 Senderos para que escojas, caminatas guiadas por naturaleza virgen. Explora bosques, quebradas y miradores junto a nuestros guías locales. Observa la flora, fauna y aves únicas en Uruguay.',
      ctaText: 'Reserva ahora',
      ctaAction: () => navigate(routes.book),
      overlay: 'dark'
    },
    {
      id: 'accommodation',
      type: 'accommodation',
      image: 'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/1737064268866.jpg',
      title: 'Alojamiento',
      description: 'Dos habitaciones en bioconstrucción con todo el confort, inmersas en naturaleza. Ideal para descansar, reconectar y observar aves.',
      ctaText: 'Reserva ahora',
      ctaAction: () => navigate(routes.accomodations),
      overlay: 'dark',
      gallery: [
        'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/DSCN0710.JPG',
        'https://imagenespasocenturion.s3.us-east-1.amazonaws.com/1737064268800.jpg'
      ]
    }
  ];


  // Sample accommodations data
  const featuredAccommodations = [
    {
      id: 'forest-cabin',
      name: 'Cabaña Ecológica Premium',
      description: 'Refugio sustentable construido con materiales locales, integrado al bosque nativo. Arquitectura bioclimática con todas las comodidades modernas.',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      capacity: { min: 2, max: 6 },
      price: 4500,
      currency: 'UYU',
      amenities: [
        'Cocina gourmet equipada',
        'Wi-Fi Starlink de alta velocidad',
        'Parrilla y deck privado',
        'Vista 360° al bosque nativo',
        'Estacionamiento cubierto',
        'Calefacción a leña ecológica'
      ],
      availability: true,
      rating: 4.9
    },
    {
      id: 'nature-room',
      name: 'Suite Vista Panorámica',
      description: 'Habitación de lujo con ventanales de piso a techo y terraza privada. Diseño minimalista que realza la conexión con la naturaleza circundante.',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      capacity: { min: 1, max: 2 },
      price: 2800,
      currency: 'UYU',
      amenities: [
        'Baño spa con productos naturales',
        'Climatización inteligente',
        'Minibar con productos regionales',
        'Terraza privada con hamaca',
        'Servicio de desayuno en habitación'
      ],
      availability: true,
      rating: 4.7
    }
  ];

  const handleBookActivity = (id: string) => {
    navigate(`${routes.book}?activity=${id}`);
  };

  const handleBookAccommodation = (id: string) => {
    navigate(`${routes.book}?accommodation=${id}`);
  };

  const handleViewActivityDetails = (id: string) => {
    navigate(`/actividades/${id}`);
  };

  const handleViewAccommodationDetails = (id: string) => {
    navigate(`${routes.accomodations}/${id}`);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <HeroSlider 
        slides={heroSlides}
        autoPlay={true}
        autoPlayInterval={6000}
        showDots={true}
        showArrows={true}
        className="home-hero"
      />

      {/* Welcome Section */}
      <section className="home-welcome">
        <div className="container">
          <div className="welcome-content">
            <div className="welcome-text">
              <div className="welcome-badge">
                <span className="badge-icon">🍃</span>
                <span className="badge-text">Explora, descansa y desconecta en un solo lugar</span>
              </div>
              <h2 className="welcome-title">Bienvenidos a Tinambú</h2>
              <p className="welcome-description">
                Sumérgete en el corazón de Paso Centurión, donde cada sendero cuenta una historia 
                y cada especie de ave te invita a descubrir la biodiversidad única del Uruguay. 
                Nuestra pasión por la naturaleza se convierte en experiencias auténticas que 
                conectan tu alma con la tierra.
              </p>
              <div className="welcome-features">
                <div className="feature-item">
                  <span className="feature-icon">🦅</span>
                  <div className="feature-content">
                    <h4>Observación de Aves</h4>
                    <p>Más de 200 especies registradas</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🏡</span>
                  <div className="feature-content">
                    <h4>Alojamiento Rural</h4>
                    <p>Cabañas sustentables en la naturaleza</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🥾</span>
                  <div className="feature-content">
                    <h4>Senderismo Guiado</h4>
                    <p>Recorridos con guías especializados</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="welcome-image">
              <div className="image-container">
                <img 
                  src={backgroundImage} 
                  alt="Naturaleza de Paso Centurión"
                  className="welcome-img"
                />
                <div className="image-overlay">
                  <div className="overlay-content">
                    <span className="overlay-text">Paso Centurión, Cerro Largo</span>
                    <span className="overlay-subtext">Uruguay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Activities */}
      <section className="home-activities">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Actividades Destacadas</h2>
            <p className="section-subtitle">
              Experiencias diseñadas para conectarte con la naturaleza
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate(routes.activities)}
              rightIcon="→"
            >
              Ver Todas las Actividades
            </Button>
          </div>
          
          <div className="activities-grid">
            {activitiesLoading ? (
              // Loading state
              [1, 2, 3].map((i) => (
                <div key={i} className="activity-card-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                  </div>
                </div>
              ))
            ) : (
              featuredActivities.map((activity) => (
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
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Accommodations */}
      <section className="home-accommodations">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Alojamiento Rural</h2>
            <p className="section-subtitle">
              Descanso confortable en plena naturaleza
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate(routes.accomodations)}
              rightIcon="→"
            >
              Ver Todos los Alojamientos
            </Button>
          </div>
          
          <div className="accommodations-grid">
            {featuredAccommodations.map((accommodation) => (
              <AccommodationCard
                key={accommodation.id}
                {...accommodation}
                onBook={handleBookAccommodation}
                onViewDetails={handleViewAccommodationDetails}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="home-team">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Lo que opinan de nosotros</h2>
            <p className="section-subtitle">
              Conocé a nuestro equipo y las experiencias de quienes ya nos visitaron
            </p>
          </div>
          
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" alt="Guía especializado" />
              </div>
              <div className="member-info">
                <h4 className="member-name">Carlos Mendoza</h4>
                <p className="member-role">Guía Ornitólogo</p>
                <p className="member-description">
                  &ldquo;Cada salida es una aventura nueva. Ver la emoción en los ojos de los visitantes 
                  cuando descubren una especie por primera vez es lo que me motiva cada día.&rdquo;
                </p>
              </div>
            </div>
            
            <div className="team-member">
              <div className="member-avatar">
                <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face" alt="Especialista en ecoturismo" />
              </div>
              <div className="member-info">
                <h4 className="member-name">Ana Rodríguez</h4>
                <p className="member-role">Especialista en Ecoturismo</p>
                <p className="member-description">
                  &ldquo;Trabajamos para que cada huésped viva una experiencia auténtica, 
                  respetando siempre nuestro entorno natural.&rdquo;
                </p>
              </div>
            </div>
            
            <div className="team-member">
              <div className="member-avatar">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" alt="Coordinador de actividades" />
              </div>
              <div className="member-info">
                <h4 className="member-name">Diego Silva</h4>
                <p className="member-role">Coordinador de Actividades</p>
                <p className="member-description">
                  &ldquo;La naturaleza de Paso Centurión es nuestro mayor tesoro. 
                  Cada actividad está diseñada para conectarte profundamente con ella.&rdquo;
                </p>
              </div>
            </div>
            
            <div className="team-member">
              <div className="member-avatar">
                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face" alt="Especialista en alojamiento" />
              </div>
              <div className="member-info">
                <h4 className="member-name">María González</h4>
                <p className="member-role">Especialista en Alojamiento</p>
                <p className="member-description">
                  &ldquo;Nuestras cabañas son un refugio perfecto donde el confort se encuentra 
                  con la sostenibilidad y la belleza natural.&rdquo;
                </p>
              </div>
            </div>
            
            <div className="team-member">
              <div className="member-avatar">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face" alt="Guía de senderismo" />
              </div>
              <div className="member-info">
                <h4 className="member-name">Roberto Fernández</h4>
                <p className="member-role">Guía de Senderismo</p>
                <p className="member-description">
                  &ldquo;Cada sendero tiene su propia magia. Mi trabajo es ayudarte a descubrir 
                  los secretos que la naturaleza guarda en cada rincón.&rdquo;
                </p>
              </div>
            </div>
          </div>
          
          <div className="testimonials-section">
            <h3 className="testimonials-title">Reseñas de Google y Facebook</h3>
            <div className="social-proof">
              <div className="rating-item">
                <div className="rating-platform">
                  <span className="platform-icon">📘</span>
                  <span className="platform-name">Facebook</span>
                </div>
                <div className="rating-stars">⭐⭐⭐⭐⭐</div>
                <div className="rating-score">4.8/5</div>
              </div>
              <div className="rating-item">
                <div className="rating-platform">
                  <span className="platform-icon">🔍</span>
                  <span className="platform-name">Google</span>
                </div>
                <div className="rating-stars">⭐⭐⭐⭐⭐</div>
                <div className="rating-score">4.9/5</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="home-cta" ref={ctaRef}>
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">¿Listo para tu Próxima Aventura?</h2>
            <p className="cta-description">
              Reservá ahora y viví una experiencia única en contacto con la naturaleza uruguaya. 
              Te esperamos en Paso Centurión para compartir momentos inolvidables.
            </p>
            <div className="cta-buttons">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => navigate(routes.book)}
                leftIcon="📅"
                className="cta-button"
              >
                Hacer Reserva
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => navigate(routes.about)}
                className="cta-button"
              >
                Conocer Más
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;