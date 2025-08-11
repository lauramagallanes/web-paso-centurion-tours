import React from 'react';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import Icon from '../../components/common/Icon';
import Illustration from '../../components/common/Illustration';
import PhotoGallery from '../../components/common/PhotoGallery';
import './About.css';

const About: React.FC = () => {
  // Team members
  const teamMembers = [
    {
      id: '1',
      name: 'Francisco Giúdice',
      role: 'Guía de Naturaleza y Observación de Aves',
      bio: 'Guía especializado bilingüe (ES-EN) en flora y fauna nativas del Paisaje Protegido Paso Centurión y Sierra de Ríos.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face'
    },
    {
      id: '2',
      name: 'Laura Magallanes',
      role: 'Guía de Naturaleza y Observación de Aves',
      bio: 'Guía especializada bilingüe (ES-EN) en reconocimiento de especies y interpretación del paisaje natural.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face'
    }
  ];

  // Sample gallery photos
  const galleryPhotos = [
    {
      id: '1',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      alt: 'Paisaje de Tinambú',
      title: 'Reserva Natural',
      description: 'Vista panorámica de nuestra reserva natural protegida.'
    },
    {
      id: '2',
      src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      alt: 'Senderos naturales',
      title: 'Senderos Interpretativos',
      description: 'Red de senderos diseñados para la observación de flora y fauna.'
    },
    {
      id: '3',
      src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
      alt: 'Observación de aves',
      title: 'Avistamiento de Aves',
      description: 'Experiencias únicas de birdwatching en hábitat natural.'
    },
    {
      id: '4',
      src: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
      alt: 'Laguna natural',
      title: 'Ecosistemas Acuáticos',
      description: 'Lagunas y arroyos que albergan rica biodiversidad.'
    }
  ];

  const values = [
    {
      icon: 'hiking' as const,
      title: 'Senderos Especializados',
      description: '7 senderos únicos por bosques ribereños, quebradas, serranías y cañadas con diferentes niveles de dificultad.'
    },
    {
      icon: 'bird' as const,
      title: 'Observación de Aves',
      description: 'Más de 180 especies registradas con acceso a comedero de aves para observar especies muy raras en Uruguay.'
    },
    {
      icon: 'bed' as const,
      title: 'Bioconstrucción',
      description: 'Alojamiento sustentable con habitaciones de bioconstrucción y techo vivo en entorno natural.'
    },
    {
      icon: 'user' as const,
      title: 'Guías Bilingües',
      description: 'Guías especializados en naturaleza y observación de aves con servicio bilingüe español-inglés.'
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-background">
          <Illustration name="nature-hero" size="full" className="hero-illustration" />
        </div>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Alojamiento & Ecoturismo</h1>
            <p className="hero-subtitle">
              Paisaje Protegido Paso Centurión y Sierra de Ríos
            </p>
            <p className="hero-description">
              Nuestra propuesta está enfocada en el disfrute, aprendizaje, valoración, cuidado e 
              interpretación del lugar donde vivimos. Te invitamos a vivir una experiencia inolvidable 
              dentro del Paisaje Protegido Paso Centurión y Sierra de Ríos, con actividades ecoturísticas 
              enfocadas en el reconocimiento de flora y fauna nativas y observación de aves.
            </p>
            <div className="hero-actions">
              <Button variant="primary" size="lg">
                <Icon name="calendar" size="sm" />
                Reservar Experiencia
              </Button>
              <Button variant="ghost" size="lg">
                <Icon name="camera" size="sm" />
                Ver Galería
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
              <h2 className="section-title">Nuestro Lugar</h2>
              <div className="story-text">
                <p>
                  Ubicados en el Paisaje Protegido Paso Centurión y Sierra de Ríos, ofrecemos 
                  una experiencia única de ecoturismo en uno de los ecosistemas más diversos 
                  y valiosos de Uruguay. Este territorio protegido alberga una extraordinaria 
                  biodiversidad que incluye más de 180 especies de aves registradas.
                </p>
                <p>
                  Nuestras actividades se desarrollan en predios privados con acceso exclusivo 
                  a través de guías locales especializados. Cada sendero ha sido diseñado para 
                  maximizar la experiencia de observación y aprendizaje, respetando siempre 
                  el equilibrio natural del entorno.
                </p>
                <p>
                  Te esperamos para vivir una experiencia inolvidable en este paisaje único, 
                  donde el monte nativo, las cañadas cristalinas y la rica fauna crean un 
                  escenario perfecto para la conexión con la naturaleza.
                </p>
              </div>
            </div>
            <div className="story-visual">
              <div className="story-image-container">
                <img 
                  src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop" 
                  alt="Paisaje natural de Tinambú"
                  className="story-image"
                />
                <div className="story-stats">
                  <div className="stat-item">
                    <span className="stat-number">180+</span>
                    <span className="stat-label">Especies de aves registradas</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">7</span>
                    <span className="stat-label">Senderos únicos</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">2</span>
                    <span className="stat-label">Habitaciones bioconstrucción</span>
                  </div>
                </div>
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
                  <Icon name="heart-filled" size="xl" color="accent" />
                </div>
                <h3 className="mission-title">Nuestra Propuesta</h3>
                <p className="mission-text">
                  Experiencias ecoturísticas enfocadas en el disfrute, aprendizaje, valoración 
                  y cuidado del Paisaje Protegido Paso Centurión y Sierra de Ríos. Ofrecemos 
                  actividades de reconocimiento de flora y fauna nativas con observación de 
                  aves especializada, guiadas por expertos locales bilingües.
                </p>
              </CardBody>
            </Card>

            <Card variant="nature" className="mission-card">
              <CardBody>
                <div className="mission-icon">
                  <Icon name="search" size="xl" color="primary" />
                </div>
                <h3 className="mission-title">Alojamiento Sustentable</h3>
                <p className="mission-text">
                  2 habitaciones de bioconstrucción con techo vivo, capacidad para 4 personas 
                  cada una. Ubicadas en un entorno natural privilegiado con acceso a comedero 
                  de aves, cañada natural y más de 180 especies de aves registradas en el lugar. 
                  Ubicación de fácil acceso sobre Ruta 7 km 439.
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
                  <Icon name={value.icon} size="lg" color="accent" />
                </div>
                <h4 className="value-title">{value.title}</h4>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Nuestros Guías</h2>
            <p className="section-description">
              Guías especializados en naturaleza y observación de aves con servicio bilingüe
            </p>
          </div>
          <div className="team-grid">
            {teamMembers.map((member) => (
              <Card key={member.id} variant="nature" className="team-card">
                <CardBody>
                  <div className="team-member">
                    <div className="member-avatar">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="avatar-image"
                      />
                    </div>
                    <div className="member-info">
                      <h4 className="member-name">{member.name}</h4>
                      <p className="member-role">{member.role}</p>
                      <p className="member-bio">{member.bio}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="about-gallery">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Galería</h2>
            <p className="section-description">
              Imágenes que capturan la esencia de Tinambú y nuestras experiencias
            </p>
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
              <p className="impact-description">
                Todos los senderos se encuentran en predios privados y se accede 
                exclusivamente con guía local. Cada experiencia incluye entrada a 
                los predios, guía especializada y botiquín de primeros auxilios.
              </p>
              <div className="impact-stats">
                <div className="impact-stat">
                  <Icon name="hiking" size="md" color="accent" />
                  <div className="stat-info">
                    <span className="stat-number">$1100</span>
                    <span className="stat-label">UYU por persona/sendero</span>
                  </div>
                </div>
                <div className="impact-stat">
                  <Icon name="bed" size="md" color="accent" />
                  <div className="stat-info">
                    <span className="stat-number">$1500</span>
                    <span className="stat-label">UYU por persona/noche</span>
                  </div>
                </div>
                <div className="impact-stat">
                  <Icon name="user" size="md" color="accent" />
                  <div className="stat-info">
                    <span className="stat-number">10%</span>
                    <span className="stat-label">Descuento grupos +10 personas</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="impact-visual">
              <Illustration name="eco-tourism" size="lg" className="impact-illustration" />
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
                  y Sierra de Ríos. Descubre más de 180 especies de aves, recorre senderos 
                  únicos y alójate en nuestras habitaciones de bioconstrucción.
                </p>
                <div className="cta-actions">
                  <Button variant="primary" size="lg">
                    <Icon name="calendar" size="sm" />
                    Reservar Sendero
                  </Button>
                  <Button variant="secondary" size="lg">
                    <Icon name="bed" size="sm" />
                    Reservar Alojamiento
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