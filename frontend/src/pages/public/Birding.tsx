import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import Icon from '../../components/common/Icon';
import PhotoGallery from '../../components/common/PhotoGallery';
import { routes } from '../../utils/routes';
import './Birding.css';

const Birding: React.FC = () => {
  const navigate = useNavigate();
  
  // Scroll to top when component mounts - immediate and forced
  useEffect(() => {
    // Force immediate scroll to top
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    
    // Also try after a tiny delay to ensure it happens after render
    const timer = setTimeout(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // Scroll to gallery section
  const scrollToGallery = () => {
    const gallerySection = document.getElementById('especies-destacadas');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  

  // Bird gallery photos - Todas las aves combinadas
  const birdGallery = [
    {
      id: '1',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave1.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave1.jpg',
      alt: 'Surucuá',
      title: 'Surucuá',
      description: 'Mata Atlántica'
    },
    {
      id: '2',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave2.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave2.jpg',
      alt: 'Perdiz de Monte',
      title: 'Perdiz de Monte',
      description: 'Monte Nativo'
    },
    {
      id: '3',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave3.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave3.jpg',
      alt: 'Federal',
      title: 'Federal',
      description: 'Humedales'
    },
    {
      id: '4',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave4.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave4.jpg',
      alt: 'Caburé',
      title: 'Caburé',
      description: 'Bosque y Áreas Abiertas'
    },
    {
      id: '5',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave5.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave5.jpg',
      alt: 'Urraca Azul',
      title: 'Urraca Azul',
      description: 'Mata Atlántica'
    },
    {
      id: '6',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave6.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave6.jpg',
      alt: 'Chiripepe',
      title: 'Chiripepe',
      description: 'Paso Centurión'
    },
    {
      id: '7',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave7.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave7.jpg',
      alt: 'Frutero coronado (hembra)',
      title: 'Frutero coronado (hembra)',
      description: 'Paso Centurión'
    },
    {
      id: '8',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave8.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave8.jpg',
      alt: 'Batará pintado (hembra)',
      title: 'Batará pintado (hembra)',
      description: 'Paso Centurión'
    },
    {
      id: '9',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave9.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave9.jpg',
      alt: 'Ñandú',
      title: 'Ñandú',
      description: 'Paso Centurión'
    },
    {
      id: '10',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave10.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave10.jpg',
      alt: 'Caminera',
      title: 'Caminera',
      description: 'Paso Centurión'
    },
    {
      id: '11',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave11.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave11.jpg',
      alt: 'Pajonalera pico recto',
      title: 'Pajonalera pico recto',
      description: 'Paso Centurión'
    }
  ];

  return (
    <div className="birding-page">
      
      {/* Hero Section */}
      <section className="birding-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <span className="hero-badge">
              <i className="bi bi-geo-alt-fill"></i>
              Birding Hotspot
            </span>
            <h1 className="hero-title">Observación de Aves en Paso Centurión</h1>
            <p className="hero-subtitle">
              Más de 280 especies registradas en uno de los mejores destinos de birding de Uruguay
            </p>
            <div className="hero-actions">
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => navigate(routes.activities)}
              >
                <Icon name="calendar" size="sm" />
                Ver Actividades
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={scrollToGallery}
              >
                <Icon name="camera" size="sm" />
                Ver Galería
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="birding-stats">
        <div className="container">
          <div className="stats-featured">
            <div className="featured-stat-card">
              <div className="featured-stat-header">
                <div className="featured-stat-icon">
                  <i className="bi bi-binoculars-fill"></i>
                </div>
                <div className="featured-stat-main">
                  <div className="featured-stat-number">+280</div>
                  <div className="featured-stat-label">Especies Registradas</div>
                </div>
              </div>
              <p className="featured-stat-description">
                Uno de los mejores destinos de birdwatching en Uruguay
              </p>
              <div className="featured-stat-links">
                <a 
                  href="https://ebird.org/hotspot/L2762826/illustrated-checklist" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="stat-link stat-link-ebird"
                >
                  <i className="bi bi-box-arrow-up-right"></i>
                  Ver en eBird
                </a>
                <a 
                  href="https://birdingplaces.eu/es/birdingplaces/uruguay/paso-centurion-y-sierra-de-rios" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="stat-link stat-link-birding"
                >
                  <i className="bi bi-box-arrow-up-right"></i>
                  Ver en BirdingPlaces
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the Area */}
      <section className="birding-area">
        <div className="container">
          <div className="area-grid">
            <div className="area-content">
              <h2 className="section-title">El Área</h2>
              <p className="area-text">
                En el noreste de Cerro Largo, en la frontera con Brasil, se encuentra Paso Centurión, 
                dentro del Paisaje Protegido Paso Centurión y Sierra de Ríos. Es un rincón tranquilo, 
                rodeado de naturaleza viva, donde los bosques con influencia de la Mata Atlántica se 
                entrelazan con los pastizales y el curso del río Yaguarón.
              </p>
              <p className="area-text">
                Este encuentro de ambientes crea un refugio excepcional para la vida silvestre. Más de 
                280 especies de aves habitan la zona, muchas de ellas difíciles de ver en otros lugares 
                del país. Paso Centurión invita a detenerse, observar y disfrutar con calma. Ideal para 
                quienes buscan conectarse con la naturaleza, caminar entre senderos y vivir la 
                experiencia del ecoturismo.
              </p>
              <p className="area-text">
                Durante todo el año, los visitantes pueden observar especies típicas de la Mata 
                Atlántica y del sur de Brasil, como el <strong>Surucuá</strong>, 
                <strong>Batará pintado</strong>, <strong>Trepador oscuro</strong> y 
                <strong>Perdiz de monte</strong>. En campos abiertos y pastizales, es posible encontrar 
                especies como el <strong>Dragón</strong>, <strong>Federal</strong>, 
                <strong>Dominó</strong> y <strong>Viudita blanca grande</strong>, entre muchas otras.
              </p>
              <div className="area-features">
                <div className="feature-item">
                  <Icon name="check" size="sm" color="success" />
                  <span>Baja presencia humana</span>
                </div>
                <div className="feature-item">
                  <Icon name="check" size="sm" color="success" />
                  <span>Acceso todo el año</span>
                </div>
                <div className="feature-item">
                  <Icon name="check" size="sm" color="success" />
                  <span>Guías especializados bilingües</span>
                </div>
                <div className="feature-item">
                  <Icon name="check" size="sm" color="success" />
                  <span>Senderos interpretativos</span>
                </div>
              </div>
            </div>
            <div className="area-image">
              <img 
                src="https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave7.jpg" 
                alt="Ave de Paso Centurión"
                className="area-img"
              />
              <div className="area-location">
                <Icon name="map" size="md" color="primary" />
                <div className="location-info">
                  <span className="location-name">Paso Centurión</span>
                  <span className="location-region">Cerro Largo, Uruguay</span>
                  <span className="location-coords">53 km SE de Melo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="especies-destacadas" className="birding-gallery">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Especies Destacadas</h2>
            <p className="section-description">
              Aves observadas en Paso Centurión
            </p>
          </div>
          <PhotoGallery
            photos={birdGallery}
            layout="grid"
            columns={3}
            gap="md"
            showCaptions={true}
            enableViewer={true}
            enableLightbox={true}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="birding-cta">
        <div className="container">
          <Card variant="nature" size="lg" className="cta-card">
            <CardBody>
              <div className="cta-content">
                <h2 className="cta-title">Reserva tu Experiencia de Birdwatching</h2>
                <p className="cta-description">
                  Descubre más de 280 especies de aves en uno de los mejores destinos de 
                  observación de aves de Uruguay. Tours guiados con expertos locales bilingües.
                </p>
                <div className="cta-features">
                  <div className="cta-feature">
                    <Icon name="check" size="sm" color="success" />
                    <span>Guía especializado bilingüe</span>
                  </div>
                </div>
                <div className="cta-actions">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate(routes.activities)}
                  >
                    <Icon name="calendar" size="sm" />
                    Reservar Tour de Aves
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

export default Birding;

