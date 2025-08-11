import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from './Logo';
import './Footer.css';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Navegación',
      links: [
        { label: 'Inicio', path: routes.home },
        { label: 'Sobre Nosotros', path: routes.about },
        { label: 'Alojamiento', path: routes.accomodations },
        { label: 'Actividades', path: routes.activities },
        { label: 'Reservar', path: routes.book },
      ]
    },
    {
      title: 'Servicios',
      links: [
        { label: 'Observación de Aves', path: routes.activities },
        { label: 'Senderismo Guiado', path: routes.activities },
        { label: 'Alojamiento Rural', path: routes.accomodations },
        { label: 'Tours Personalizados', path: routes.book },
      ]
    },
    {
      title: 'Información',
      links: [
        { label: 'Mis Reservas', path: routes.myBookings },
        { label: 'Política de Privacidad', path: '/privacy' },
        { label: 'Términos de Servicio', path: '/terms' },
        { label: 'Preguntas Frecuentes', path: '/faq' },
      ]
    }
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/tinambupasocenturion',
      icon: '📘',
      color: '#1877f2'
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/tinambupasocenturion',
      icon: '📷',
      color: '#E4405F'
    },
    {
      name: 'WhatsApp',
      url: 'https://wa.me/59898394653',
      icon: '💬',
      color: '#25D366'
    },
    {
      name: 'Email',
      url: 'mailto:pasocenturiontours@gmail.com',
      icon: '📧',
      color: '#EA4335'
    }
  ];

  const contactInfo = [
    {
      icon: '📍',
      label: 'Ubicación',
      value: 'Paso Centurión, Cerro Largo, Uruguay'
    },
    {
      icon: '📞',
      label: 'Teléfono',
      value: '+598 98 394 653',
      link: 'tel:+59898394653'
    },
    {
      icon: '📧',
      label: 'Email',
      value: 'pasocenturiontours@gmail.com',
      link: 'mailto:pasocenturiontours@gmail.com'
    },
    {
      icon: '🕐',
      label: 'Horarios',
      value: 'Lun - Dom: 7:00 - 19:00'
    }
  ];

  return (
    <footer className="main-footer" role="contentinfo">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Brand Section */}
          <div className="footer-brand">
            <Logo 
              variant="full" 
              size="lg" 
              color="light"
              className="footer-logo"
            />
            <p className="footer-brand-tagline">
              Paso Centurión Tours
            </p>
            <p className="footer-description">
              Descubre la belleza natural de Uruguay a través de experiencias únicas de 
              ecoturismo, observación de aves y senderismo guiado en un entorno pristino.
            </p>
            
            {/* Social Links */}
            <div className="footer-social">
              <h4 className="footer-social-title">Síguenos</h4>
              <div className="social-links">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label={`Visitar nuestro ${social.name}`}
                    title={social.name}
                  >
                    <span className="social-icon">{social.icon}</span>
                    <span className="social-name">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className="footer-links">
            {footerLinks.map((section) => (
              <div key={section.title} className="footer-section">
                <h4 className="footer-section-title">{section.title}</h4>
                <ul className="footer-section-links">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link 
                        to={link.path} 
                        className="footer-link"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="footer-contact">
            <h4 className="footer-section-title">Contacto</h4>
            <div className="contact-info">
              {contactInfo.map((info) => (
                <div key={info.label} className="contact-item">
                  <span className="contact-icon">{info.icon}</span>
                  <div className="contact-details">
                    <span className="contact-label">{info.label}</span>
                    {info.link ? (
                      <a 
                        href={info.link} 
                        className="contact-value contact-link"
                        {...(info.link.startsWith('tel:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                      >
                        {info.value}
                      </a>
                    ) : (
                      <span className="contact-value">{info.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Newsletter Signup */}
            <div className="footer-newsletter">
              <h5 className="newsletter-title">Mantente Informado</h5>
              <p className="newsletter-description">
                Recibe noticias sobre nuevas actividades y ofertas especiales
              </p>
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Tu email" 
                  className="newsletter-input"
                  aria-label="Email para newsletter"
                />
                <button type="submit" className="newsletter-button">
                  Suscribirse
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="footer-copyright">
              <p>© {currentYear} Tinambú - Paso Centurión Tours. Todos los derechos reservados.</p>
            </div>
            
            <div className="footer-bottom-links">
              <Link to="/privacy" className="footer-bottom-link">
                Privacidad
              </Link>
              <span className="footer-divider">•</span>
              <Link to="/terms" className="footer-bottom-link">
                Términos
              </Link>
              <span className="footer-divider">•</span>
              <Link to="/accessibility" className="footer-bottom-link">
                Accesibilidad
              </Link>
            </div>

            <div className="footer-certifications">
              <span className="certification-badge">🌿 Turismo Sostenible</span>
              <span className="certification-badge">🦅 Ecoturismo Certificado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Volver arriba"
        title="Volver arriba"
      >
        ↑
      </button>
    </footer>
  );
};

export default Footer;