import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSlider, { HeroSlide } from '../../components/common/HeroSlider';
import Card, { CardBody, CardImage } from '../../components/common/Card';
import ActivityCard from '../../components/common/ActivityCard';
import AccommodationCard from '../../components/common/AccommodationCard';
import Button from '../../components/common/Button';
import { routes } from '../../utils/routes';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  // Hero slider data
  const heroSlides: HeroSlide[] = [
    {
      id: 'nature-experience',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
      title: 'Descubre la Magia de Paso Centurión',
      subtitle: '🌿 Ecoturismo Auténtico',
      description: 'Sumérgete en la biodiversidad única del Uruguay. Más de 200 especies de aves, senderos naturales y la hospitalidad más cálida te esperan en este paraíso ecológico.',
      ctaText: 'Comenzar Aventura',
      ctaAction: () => navigate(routes.activities),
      overlay: 'gradient'
    },
    {
      id: 'birdwatching',
      image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80',
      title: 'Observación de Aves de Clase Mundial',
      subtitle: '🦅 280+ Especies Registradas',
      description: 'Acompañados por ornitólogos expertos, descubre especies únicas en su hábitat natural. Equipos profesionales incluidos y experiencias para todos los niveles.',
      ctaText: 'Explorar Avifauna',
      ctaAction: () => navigate(routes.activities),
      overlay: 'gradient'
    },
    {
      id: 'accommodation',
      image: 'https://images.unsplash.com/photo-1464822759844-d150baec7494?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: 'Alojamiento Sustentable Premium',
      subtitle: '🏡 Confort en la Naturaleza',
      description: 'Cabañas ecológicas y habitaciones diseñadas en armonía con el entorno. Construcción sustentable, comodidades modernas y vistas espectaculares.',
      ctaText: 'Reservar Estadía',
      ctaAction: () => navigate(routes.accomodations),
      overlay: 'gradient'
    }
  ];

  // Sample activities data
  const featuredActivities = [
    {
      id: 'birdwatching-morning',
      name: 'Observación de Aves al Amanecer',
      description: 'Experiencia mágica con la avifauna matutina. Guías ornitólogos expertos te llevarán a descubrir especies únicas mientras el sol ilumina el paisaje natural.',
      image: 'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80',
      duration: '3-4 horas',
      difficulty: 'Fácil' as const,
      price: 2500,
      currency: 'UYU',
      maxParticipants: 8,
      includes: [
        'Guía ornitólogo certificado',
        'Binoculares Bushnell profesionales',
        'Desayuno campestre gourmet',
        'Guía de especies ilustrada',
        'Seguro de actividad'
      ]
    },
    {
      id: 'nature-trail',
      name: 'Sendero de la Biodiversidad',
      description: 'Inmersión total en ecosistemas nativos. Descubre plantas medicinales, rastros de fauna y aprende sobre conservación en este recorrido educativo único.',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      duration: '2-3 horas',
      difficulty: 'Moderado' as const,
      price: 1800,
      currency: 'UYU',
      maxParticipants: 12,
      includes: [
        'Guía naturalista especializado',
        'Refrigerio con productos locales',
        'Mapa detallado del sendero',
        'Kit de observación naturalista',
        'Certificado de participación'
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

  const handleViewDetails = (id: string) => {
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
              <h2 className="section-title">Bienvenidos a Tinambú</h2>
              <p className="welcome-description">
                En el corazón de Paso Centurión, te invitamos a descubrir una experiencia única de 
                ecoturismo. Nuestra pasión por la naturaleza y la hospitalidad uruguaya se combinan 
                para ofrecerte momentos inolvidables en contacto directo con la biodiversidad local.
              </p>
              <div className="welcome-stats">
                <div className="stat-item">
                  <span className="stat-number">200+</span>
                  <span className="stat-label">Especies de Aves</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">15</span>
                  <span className="stat-label">Años de Experiencia</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">1000+</span>
                  <span className="stat-label">Visitantes Satisfechos</span>
                </div>
              </div>
            </div>
            <div className="welcome-image">
              <img 
                src="/src/assets/illustrations/Foto home  conocenos.svg" 
                alt="Naturaleza de Paso Centurión"
                className="welcome-img"
              />
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
            {featuredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                {...activity}
                onBook={handleBookActivity}
              />
            ))}
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
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="home-features">
        <div className="container">
          <h2 className="section-title text-center">¿Por Qué Elegir Tinambú?</h2>
          
          <div className="features-grid">
            <Card variant="nature" size="md" className="feature-card">
              <CardBody>
                <div className="feature-icon">🌿</div>
                <h3 className="feature-title">Turismo Sostenible</h3>
                <p className="feature-description">
                  Comprometidos con la conservación del medio ambiente y el desarrollo 
                  responsable del turismo rural.
                </p>
              </CardBody>
            </Card>

            <Card variant="nature" size="md" className="feature-card">
              <CardBody>
                <div className="feature-icon">👨‍🏫</div>
                <h3 className="feature-title">Guías Especializados</h3>
                <p className="feature-description">
                  Nuestros guías locales son expertos en ornitología y conocen cada 
                  rincón de la región como la palma de su mano.
                </p>
              </CardBody>
            </Card>

            <Card variant="nature" size="md" className="feature-card">
              <CardBody>
                <div className="feature-icon">🏠</div>
                <h3 className="feature-title">Hospitalidad Auténtica</h3>
                <p className="feature-description">
                  Experimentá la calidez de la hospitalidad uruguaya en un ambiente 
                  familiar y acogedor.
                </p>
              </CardBody>
            </Card>

            <Card variant="nature" size="md" className="feature-card">
              <CardBody>
                <div className="feature-icon">📍</div>
                <h3 className="feature-title">Ubicación Privilegiada</h3>
                <p className="feature-description">
                  Paso Centurión ofrece una biodiversidad única, siendo punto de encuentro 
                  de diferentes ecosistemas.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="home-cta">
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