import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import Icon from '../../components/common/Icon';
import { BedIcon } from '../../components/common/BedIcon';
import Illustration from '../../components/common/Illustration';
import PhotoGallery from '../../components/common/PhotoGallery';
import { routes } from '../../utils/routes';
import './About.css';

const About: React.FC = () => {
  const navigate = useNavigate();
  
  // Gallery photos from S3
  const galleryPhotos = [
    {
      id: '1',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave1.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave1.jpg',
      alt: 'Surucuá',
      title: 'Surucuá',
      description: 'Especie destacada de la Mata Atlántica'
    },
    {
      id: '2',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave2.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave2.jpg',
      alt: 'Perdiz de Monte',
      title: 'Perdiz de Monte',
      description: 'Especie del monte nativo'
    },
    {
      id: '3',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave3.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave3.jpg',
      alt: 'Federal',
      title: 'Federal',
      description: 'Especie de humedales'
    },
    {
      id: '4',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave4.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave4.jpg',
      alt: 'Caburé',
      title: 'Caburé',
      description: 'Especie de bosque y áreas abiertas'
    },
    {
      id: '5',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave6.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave6.jpg',
      alt: 'Chiripepe',
      title: 'Chiripepe',
      description: 'Especie de Paso Centurión'
    },
    {
      id: '6',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave7.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave7.jpg',
      alt: 'Frutero coronado',
      title: 'Frutero coronado',
      description: 'Especie de Paso Centurión'
    },
    {
      id: '7',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave8.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave8.jpg',
      alt: 'Batará pintado',
      title: 'Batará pintado',
      description: 'Especie de Paso Centurión'
    },
    {
      id: '8',
      src: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave9.jpg',
      thumbnail: 'https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave9.jpg',
      alt: 'Ñandú',
      title: 'Ñandú',
      description: 'Especie de Paso Centurión'
    }
  ];

  const values = [
    {
      icon: 'bi-person-walking',
      title: 'Senderos Guiados',
      description: '+7 senderos únicos por bosques ribereños, quebradas, serranías y cañadas con diferentes niveles de dificultad.'
    },
    {
      icon: 'bi-binoculars',
      title: 'Observación de Aves',
      description: 'Más de 280 especies registradas. Experiencias guiadas para descubrir la rica avifauna del lugar.'
    },
    {
      icon: 'bed-svg',
      title: 'Alojamiento',
      description: 'Alojamiento sustentable con habitaciones de bioconstrucción y techo vivo en entorno natural.'
    },
    {
      icon: 'bi-translate',
      title: 'Guías Bilingües',
      description: 'Guías especializados en naturaleza y observación de aves con servicio bilingüe español-inglés.'
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-background-image"></div>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Tinambú - Paso Centurión Tours</h1>
            <p className="hero-subtitle">
              Ecoturismo y Observación de Aves
            </p>
            <p className="hero-description">
              Somos una empresa familiar dedicada al ecoturismo en el Paisaje Protegido Paso Centurión y Sierra de Ríos. 
              Ofrecemos experiencias de conexión con la naturaleza a través de senderos guiados, observación de aves 
              y reconocimiento de flora y fauna en uno de los ecosistemas más diversos de Uruguay.
            </p>
            <div className="hero-actions">
              <Button 
                variant="primary" 
                size="lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(routes.activities);
                }}
                className="hero-action-btn hero-btn-primary"
              >
                <i className="bi bi-signpost-split"></i>
                Ver Actividades
              </Button>
              <Button 
                variant="primary" 
                size="lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(routes.alojamientos);
                }}
                className="hero-action-btn hero-btn-secondary"
              >
                <i className="bi bi-house-door"></i>
                Ver Alojamiento
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-story">
        <div className="container">
          <div className="story-grid">
            <div className="story-content">
              <h2 className="section-title">Sobre Nosotros</h2>
              <div className="story-text">
                <p>
                  <strong>Tinambú - Paso Centurión Tours</strong> es una propuesta de ecoturismo ubicada 
                  en el corazón del Paisaje Protegido Paso Centurión y Sierra de Ríos, en el noreste de 
                  Cerro Largo, Uruguay. Nos encontramos en uno de los ecosistemas más diversos y valiosos 
                  del país, donde la Mata Atlántica se encuentra con los pastizales naturales y el río Yaguarón.
                </p>
                <p>
                  Somos guías de naturaleza, enfocados en la observación de aves, reconocimiento de flora y fauna nativa,
                  e interpretación ambiental. Nuestra misión es ofrecer experiencias auténticas
                  de conexión con la naturaleza, promoviendo el disfrute responsable, el aprendizaje sobre la biodiversidad
                  local y la valoración de este paisaje único.
                </p>
                <p>
                  Ofrecemos alojamiento sustentable en habitaciones de bioconstrucción, senderos 
                  interpretativos para observación de aves y naturaleza, y experiencias personalizadas 
                  que respetan el equilibrio natural del entorno. Cada actividad está diseñada para 
                  que nuestros visitantes descubran la riqueza de este lugar mientras contribuyen a 
                  su conservación.
                </p>
              </div>
            </div>
            <div className="story-visual">
              <div className="story-image-container">
                <img
                  src="https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/gallery/ave9.jpg"
                  alt="Paisaje natural de Tinambú"
                  className="story-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-mission">
        <div className="container">
          <div className="mission-grid">
            <Card variant="nature" className="mission-card">
              <CardBody>
                <div className="mission-icon">
                  <i className="bi bi-person-walking" aria-hidden="true"></i>
                </div>
                <h3 className="mission-title">Actividades</h3>
                <p className="mission-text">
                  Ofrecemos actividades ecoturísticas enfocadas en la observación de aves, reconocimiento de flora y fauna local,
                  e interpretación ambiental. Los senderos que realizamos recorren diferentes hábitats: bosques ribereños,
                  quebradas, serranías y cañadas. Cada sendero ofrece oportunidades únicas para observar una gran variedad de
                  especies de aves, incluyendo especies que solo están registradas para este lugar en Uruguay.
                </p>
              </CardBody>
            </Card>

            <Card variant="nature" className="mission-card">
              <CardBody>
                <div className="mission-icon">
                  <BedIcon />
                </div>
                <h3 className="mission-title">Alojamiento</h3>
                <p className="mission-text">
                  Te ofrecemos <strong>habitaciones cómodas y equipadas</strong>, con baño privado, agua caliente,
                  frigobar, TV y WiFi. Tendrás acceso a las áreas comunes y a un comedero de aves donde podés
                  disfrutar de una gran variedad de especies en su entorno natural. Estamos sobre la <strong>Ruta 7</strong>,
                  dentro del <strong>área protegida Paso Centurión y Sierra de Ríos</strong>, a sólo 3 km del Río Yaguarón.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Nuestros Servicios</h2>
            <p className="section-description">
              Experiencias únicas en el Paisaje Protegido Paso Centurión y Sierra de Ríos
            </p>
          </div>
          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-item">
                <div className="value-icon">
                  {value.icon === 'bed-svg' ? (
                    <BedIcon />
                  ) : (
                    <i className={value.icon}></i>
                  )}
                </div>
                <h4 className="value-title">{value.title}</h4>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="about-gallery">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Galería</h2>
          </div>
          <PhotoGallery
            photos={galleryPhotos}
            layout="grid"
            columns={4}
            gap="md"
            showCaptions={true}
            enableViewer={true}
            enableLightbox={true}
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="about-impact">
        <div className="container">
          <div className="impact-content">
            <div className="impact-text">
              <h2 className="section-title">Información Importante</h2>
              <div className="impact-info-grid">
                <div className="impact-info-section">
                  <h4 className="info-section-title">Sobre los Senderos</h4>
                  <div className="impact-info-list">
                    <div className="info-item">
                      <i className="bi bi-shield-check"></i>
                      <span>Todos los senderos se encuentran en predios privados y se accede exclusivamente con guía local</span>
                    </div>
                    <div className="info-item">
                      <i className="bi bi-arrows-angle-contract"></i>
                      <span>Cada sendero es adaptable a las necesidades de cada grupo</span>
                    </div>
                    <div className="info-item">
                      <i className="bi bi-check-circle"></i>
                      <span>Cada experiencia incluye entrada a los predios, guía especializada y botiquín de primeros auxilios</span>
                    </div>
                    <div className="impact-stat">
                      <i className="bi bi-people"></i>
                      <div className="stat-info">
                        <span className="stat-number">10%</span>
                        <span className="stat-label">Descuento grupos +10 personas</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="impact-info-section">
                  <h4 className="info-section-title">Servicios del Alojamiento</h4>
                  <div className="impact-info-list">
                    <div className="info-item">
                      <i className="bi bi-wifi"></i>
                      <span>WiFi incluido en todas las habitaciones y espacios exteriores</span>
                    </div>
                    <div className="info-item">
                      <i className="bi bi-door-open"></i>
                      <span>Cada habitación cuenta con baño privado</span>
                    </div>
                    <div className="info-item">
                      <i className="bi bi-snow"></i>
                      <span>Frigobar en todas las habitaciones</span>
                    </div>
                    <div className="info-item">
                      <i className="bi bi-house-heart"></i>
                      <span>Cocina compartida disponible para cocinar o calentar comida</span>
                    </div>
                    <div className="info-item">
                      <i className="bi bi-cup-hot"></i>
                      <span>Desayuno tipo continental incluido</span>
                    </div>
                  </div>
                </div>
                <div className="impact-info-section">
                  <h4 className="info-section-title">Horarios</h4>
                  <div className="impact-info-list">
                    <div className="info-item">
                      <i className="bi bi-box-arrow-in-right"></i>
                      <span><strong>Check in:</strong> de 15:00 a 20:00 h</span>
                    </div>
                    <div className="info-item">
                      <i className="bi bi-box-arrow-right"></i>
                      <span><strong>Check out:</strong> hasta las 12:00 h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <Card variant="nature" size="lg" className="cta-card">
            <CardBody>
              <div className="cta-content">
                <h2 className="cta-title">¡Te esperamos!</h2>
                <p className="cta-description">
                  Vive una experiencia inolvidable en el Paisaje Protegido Paso Centurión 
                  y Sierra de Ríos.
                </p>
                <div className="cta-actions">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate(routes.activities)}
                  >
                    <Icon name="hiking" size="sm" />
                    Ver Senderos Disponibles
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="lg"
                    onClick={() => navigate(routes.alojamientos)}
                  >
                    <Icon name="bed" size="sm" />
                    Ver Alojamiento
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

export default About;