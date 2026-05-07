import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { fixArrayEncoding } from '../../utils/encodingFixer';
import { getReviewsSummary, ReviewsSummary } from '../../services/reviewsService';
import HeroSliderV2, { HeroSlide } from '../../components/common/HeroSliderV2';

import SenderoCardV2 from '../../components/common/SenderoCardV2';
import ReviewsSlider from '../../components/common/ReviewsSlider';
import Button from '../../components/common/Button';
import IllustratedMap from '../../components/common/IllustratedMap';
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
  
  // State for reviews
  const [reviews, setReviews] = useState<ReviewsSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    // Apply background image to CTA section
    if (ctaRef.current) {
      ctaRef.current.style.setProperty('--mapa-background', `url(${mapaImage})`);
    }
    
    // Load featured activities and reviews
    loadFeaturedActivities();
    loadReviews();
  }, []);
  
  const loadReviews = async () => {
    try {
      const reviewsData = await getReviewsSummary();
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadFeaturedActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await apiService.getSenderos() as any;
      
      if (response.success) {
        const fixedData = fixArrayEncoding(response.data);

        const transformedActivities = fixedData.slice(0, 3).map((sendero: any) => {
          const difficultyMap: Record<string, string> = {
            'FACIL': 'Fácil',
            'MODERADO': 'Moderado',
            'DIFICIL': 'Difícil',
            'EXPERTO': 'Experto'
          };

          let imagenUrl = '';
          if (sendero.imagenPrincipal && sendero.imagenPrincipal.trim() !== '') {
            imagenUrl = sendero.imagenPrincipal.trim();
          } else if (sendero.urlImagen && sendero.urlImagen.trim() !== '') {
            imagenUrl = sendero.urlImagen.trim();
          }

          return {
            id: sendero.id,
            nombre: sendero.nombre,
            descripcion: sendero.descripcion,
            imagenUrl: imagenUrl, // Simple string, empty if no image
            duracion: `${sendero.duracionHoras} hora${sendero.duracionHoras !== 1 ? 's' : ''}`,
            dificultad: difficultyMap[sendero.nivelDificultad] || 'Moderado',
            precio: sendero.precioPorPersona,
            moneda: 'UYU',
            maxParticipants: sendero.capacidadMaximaGrupo
          };
        });
        
        setFeaturedActivities(transformedActivities);
      }
    } catch (error) {
      console.error('❌ ERROR: No se pudieron cargar los senderos:', error);
      
      // Fallback a senderos por defecto si hay problemas de conectividad
      setFeaturedActivities([
        {
          id: 'fallback-1',
          name: 'Senderos de Paso Centurión',
          description: 'Descubre la naturaleza única de Uruguay con nuestros senderos guiados.',
          imagenPrincipal: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=500&h=300&fit=crop',
          totalImagenes: 1,
          tieneGaleria: false,
          duration: '3-4 horas',
          difficulty: 'Moderado',
          price: 1100,
          currency: 'UYU',
          maxParticipants: 12,
          includes: ['Guía especializado', 'Equipo básico', 'Refrigerio']
        }
      ]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Hero slider data
  const heroSlides: HeroSlide[] = [
    {
      id: 'tinambu',
      type: 'tinambu',
      image: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/slider/slide-tinambu.jpg',
      title: 'Tinambú',
      subtitle: 'Ecolodge familiar en Paso Centurión',
      description: 'Aventura, descanso y naturaleza en un entorno protegido, con senderismo guiado, observación de aves y alojamiento sustentable, avalado por organismos ambientales y turísticos.',
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
      image: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/slider/slide-aves.jpg',
      title: 'Avistamiento de aves',
      subtitle: 'Más de 280 especies en hábitats diversos',
      description: 'Observación guiada para amantes de las aves, la fotografía y la biodiversidad.',
      ctaText: 'Descubre',
      ctaAction: () => navigate(routes.activities),
      overlay: 'dark',
      gallery: [
        'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/slider/ave-1.jpg',
        'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/slider/ave-2.jpg',
        'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/slider/ave-3.jpg'
      ]
    },
    {
      id: 'hiking',
      type: 'hiking',
      image: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/slider/slide-senderismo.jpg',
      title: 'Senderismo guiado',
      subtitle: 'Tenemos 7 Senderos para que escojas',
      description: 'Caminatas guiadas por naturaleza virgen. Explora bosques, quebradas y miradores junto a nuestros guías locales. Observa la flora, fauna y aves únicas en Uruguay.',
      ctaText: 'Reserva ahora',
      ctaAction: () => navigate(routes.book),
      overlay: 'dark'
    }
  ];

  const handleBookActivity = (id: string) => {
    navigate(`${routes.book}?activity=${id}`);
  };

  const handleViewActivityDetails = (id: string) => {
    navigate(`/actividades/${id}`);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <HeroSliderV2 
        slides={heroSlides}
        autoPlay={true}
        autoPlayInterval={6000}
        showDots={true}
        showArrows={true}
        className="home-hero"
      />

      {/* Intro Section */}
      <section className="home-intro">
        <div className="container">
          <div className="intro-content">
            {/* Images Side */}
            <div className="intro-images">
              <div className="intro-image-group">
                <div className="intro-image-container first">
                  <div className="decorative-badge top">Birding</div>
                  <div className="image-circle">
                    <img 
                      src="https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/intro/image-1.jpg" 
                      alt="Birding en Paso Centurión"
                    />
                  </div>
                  <div className="decorative-accent accent-1"></div>
                </div>
                
                <div className="intro-image-container second">
                  <div className="decorative-badge bottom">Ecoturismo</div>
                  <div className="image-circle">
                    <img 
                      src="https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/intro/image-2.jpg" 
                      alt="Ecoturismo en Paso Centurión"
                    />
                  </div>
                  <div className="decorative-accent accent-2"></div>
                </div>
              </div>
            </div>

            {/* Text Side */}
            <div className="intro-text">
              <h2 className="intro-title">Explora, descubre y descansa en un solo lugar</h2>
              <p className="intro-description">
                Ubicado en el corazón de Paso Centurión, Tinambú es un santuario ecológico donde 
                puedes conectarte con la naturaleza, recorrer senderos, observar aves y descansar 
                en cabañas sustentables. Es el destino ideal para quienes aman el aire libre, la 
                tranquilidad y la aventura.
              </p>
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => navigate(routes.about)}
                className="intro-cta"
              >
                Conocenos →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="home-welcome">
        <div className="container">
          <div className="welcome-header">
            <h2 className="welcome-title">Empieza a planear tu aventura</h2>
          </div>

          <div className="welcome-experiences">
            <div 
              className="experience-card experience-hiking"
              onClick={() => navigate(routes.activities)}
              style={{
                backgroundImage: `url(https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/home/senderismo.jpg)`
              }}
            >
              <div className="experience-overlay"></div>
              <div className="experience-content">
                <p className="experience-subtitle">Senderos únicos en Paso Centurión</p>
                <h3 className="experience-title">
                  Senderismo guiado <span className="arrow">→</span>
                </h3>
              </div>
            </div>

            <div 
              className="experience-card experience-accommodation"
              onClick={() => navigate(routes.alojamientos)}
              style={{
                backgroundImage: `url(https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/home/alojamiento.jpg)`
              }}
            >
              <div className="experience-overlay"></div>
              <div className="experience-content">
                <p className="experience-subtitle">Bioconstrucción con Techo Vivo</p>
                <h3 className="experience-title">
                  Alojamiento <span className="arrow">→</span>
                </h3>
              </div>
            </div>

            <div 
              className="experience-card experience-birdwatching"
              onClick={() => navigate(routes.activities)}
              style={{
                backgroundImage: `url(https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/home/avistamiento.jpg)`
              }}
            >
              <div className="experience-overlay"></div>
              <div className="experience-content">
                <p className="experience-subtitle">Más de 150 especies en un entorno protegido</p>
                <h3 className="experience-title">
                  Avistamiento de aves <span className="arrow">🔍</span>
                </h3>
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
              ))
            )}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="home-location">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">¿Dónde estamos?</h2>
            <p className="section-subtitle">
              Tinambú · Paso Centurión Tours se encuentra en Paso del Centurión, sobre la
              Ruta 7, junto al Río Yaguarón, en el límite con Brasil.
            </p>
          </div>
          <IllustratedMap />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="home-testimonials">
        <div className="container">
          <h2 className="testimonials-main-title">Lo que opinan de nosotros</h2>
          
          {reviewsLoading ? (
            <div className="testimonials-loading">Cargando opiniones...</div>
          ) : reviews ? (
            <>
              <div className="testimonials-cards-wrapper">
                {/* Google Reviews Card */}
                <div className="testimonial-card google-card">
                  <div className="testimonial-logo">Google</div>
                  <div className="testimonial-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`star ${star <= Math.round(reviews.google.rating) ? 'filled' : 'empty'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="testimonial-based-on">
                    Basado en {reviews.google.totalReviews} opiniones
                  </p>
                </div>
                
                {/* Facebook Reviews Card */}
                <div className="testimonial-card facebook-card">
                  <div className="testimonial-logo">facebook</div>
                  <div className="testimonial-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`star ${star <= Math.round(reviews.facebook.rating) ? 'filled' : 'empty'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="testimonial-based-on">
                    Basado en {reviews.facebook.totalReviews} opiniones
                  </p>
                </div>
              </div>
              
              {/* Individual Reviews Slider */}
              {reviews.google.reviews && reviews.google.reviews.length > 0 && (
                <div className="individual-reviews-section">
                  <ReviewsSlider reviews={reviews.google.reviews} />
                </div>
              )}
            </>
          ) : (
            <div className="testimonials-error">Error al cargar opiniones</div>
          )}
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