import React from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import './Book.css';

const Book: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="book-page">
      {/* Hero */}
      <section className="book-hero">
        <div className="book-hero-overlay" />
        <div className="container">
          <div className="book-hero-content">
            <div className="book-hero-badge">
              <i className="bi bi-calendar-check" />
              Reservas
            </div>
            <h1 className="book-hero-title">Realizar Reserva</h1>
            <p className="book-hero-subtitle">
              Elegí tu experiencia en Tinambú · Paso Centurión y reservá con pago seguro
            </p>
          </div>
        </div>
      </section>

      {/* Selector */}
      <section className="book-form-section">
        <div className="container">
          <div className="booking-type-selection">
            <h2 className="booking-type-title">¿Qué tipo de reserva querés hacer?</h2>
            <p className="booking-type-subtitle">
              Elegí una opción para explorar la disponibilidad y reservar
            </p>

            <div className="booking-type-cards">
              {/* Alojamiento */}
              <div
                className="booking-type-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(routes.alojamientos)}
                onKeyDown={e => e.key === 'Enter' && navigate(routes.alojamientos)}
              >
                <div className="booking-type-card-icon">
                  <i className="bi bi-house-door-fill" />
                </div>
                <div className="booking-type-card-content">
                  <h3 className="booking-type-card-title">Alojamiento</h3>
                  <p className="booking-type-card-desc">
                    Explorá nuestras habitaciones y cabañas, elegí la que más te guste y reservá tu estadía
                  </p>
                  <span className="booking-type-card-cta">
                    Ver alojamientos <i className="bi bi-arrow-right" />
                  </span>
                </div>
              </div>

              {/* Sendero */}
              <div
                className="booking-type-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(routes.activities)}
                onKeyDown={e => e.key === 'Enter' && navigate(routes.activities)}
              >
                <div className="booking-type-card-icon">
                  <i className="bi bi-signpost-2-fill" />
                </div>
                <div className="booking-type-card-content">
                  <h3 className="booking-type-card-title">Sendero</h3>
                  <p className="booking-type-card-desc">
                    Conocé nuestros senderos guiados, elegí tu excursión y reservá tu lugar
                  </p>
                  <span className="booking-type-card-cta">
                    Ver senderos <i className="bi bi-arrow-right" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Book;
