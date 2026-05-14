import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from './Logo';
import 'bootstrap-icons/font/bootstrap-icons.css';
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
        { label: 'Alojamiento', path: routes.alojamientos },
        { label: 'Actividades', path: routes.activities },
        { label: 'Reservar', path: routes.book },
      ]
    },
    {
      title: 'Servicios',
      links: [
        { label: 'Observación de Aves', path: routes.activities },
        { label: 'Senderismo Guiado', path: routes.activities },
        { label: 'Alojamiento Rural', path: routes.alojamientos },
        { label: 'Tours Personalizados', path: routes.book },
      ]
    },
    {
      title: 'Información',
      links: [
        { label: 'Mis Reservas', path: routes.myBookings },
        { label: 'Política de Privacidad', path: routes.privacy },
        { label: 'Términos y Condiciones', path: routes.terms },
        { label: 'Política de Cookies', path: routes.cookies },
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
      url: 'mailto:info@pasocenturion.com.uy',
      icon: '📧',
      color: '#EA4335'
    }
  ];

  const bookingPlatforms = [
    {
      name: 'Booking.com',
      url: 'https://www.booking.com/hotel/uy/tinambu-paso-centurion-tours.es.html',
      logo: '/logos/booking-logo.png',
      color: '#003580'
    },
    {
      name: 'TripAdvisor',
      url: 'https://www.tripadvisor.com.ar/Hotel_Review-g612486-d33991485-Reviews-Tinambu_Paso_Centurion_Tours-Melo_Cerro_Largo_Department.html',
      logo: '/logos/tripadvisor-logo.png',
      color: '#00AF87'
    },
    {
      name: 'Airbnb',
      url: 'https://www.airbnb.mx/rooms/1542094179325264668',
      logo: '/logos/airbnb-logo.png',
      color: '#FF5A5F'
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
      value: 'info@pasocenturion.com.uy',
      link: 'mailto:info@pasocenturion.com.uy'
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
        
        {/* Fila superior - Plataformas */}
        <div className="footer-row-top">
          <div className="footer-platforms">
            <span className="platforms-label">Reserva en:</span>
            {bookingPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="platform-link"
                aria-label={platform.name}
              >
                <img 
                  src={platform.logo} 
                  alt={platform.name}
                  className="platform-img"
                />
              </a>
            ))}
          </div>
          
          {/* MINTUR - más grande y a la derecha */}
          <a
            href="https://www.gub.uy/ministerio-turismo/"
            target="_blank"
            rel="noopener noreferrer"
            className="mintur-link-large"
          >
            <img 
              src="/logos/mintur-certificado.jpeg" 
              alt="MINTUR"
              className="mintur-img-large"
            />
          </a>
        </div>

        {/* Fila inferior - Logo, Legal y Contacto */}
        <div className="footer-row-bottom">
          
          {/* Logo con ave encima (ave más grande) */}
          <div className="footer-brand">
            <img 
              src="/logos/tinambu-ave.png" 
              alt="Ave" 
              className="brand-ave-large"
            />
            <img 
              src="/logos/tinambu-texto.png" 
              alt="Tinambú" 
              className="brand-texto-small"
            />
            <span className="brand-subtitle-small">Paso centurion Tours</span>
          </div>

          {/* Links legales */}
          <div className="footer-legal">
            <span>Tinambú - Paso centurion tours ®</span>
            <span className="sep">¥</span>
            <Link to={routes.privacy}>Políticas de privacidad</Link>
            <span className="sep">¥</span>
            <Link to={routes.terms}>Términos y condiciones</Link>
            <span className="sep">¥</span>
            <Link to={routes.cookies}>Política de cookies</Link>
          </div>

          {/* Contacto horizontal con Bootstrap Icons */}
          <div className="footer-contact-horizontal">
            <h4>Contácto</h4>
            <div className="social-icons-horizontal">
              <a
                href="https://www.facebook.com/tinambupasocenturion"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-bs"
                aria-label="Facebook"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a
                href="https://instagram.com/tinambupasocenturion"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-bs"
                aria-label="Instagram"
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a
                href="https://wa.me/59898394653"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-bs"
                aria-label="WhatsApp"
              >
                <i className="bi bi-whatsapp"></i>
              </a>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;